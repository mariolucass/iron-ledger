import type { DomainEvent } from "@iron-ledger/shared-types";
import type { ReservationSnapshot } from "@iron-ledger/workflow-contracts";
import { Prisma, type PrismaClient } from "@prisma/client";
import { enqueueEvents } from "../../../../infra/outbox/outbox.writer";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { pagination } from "../../../../shared/utils/pagination";
import { StockLevel } from "../../domain/entities/stock-level.entity";
import { stockReservationEvent } from "../../domain/events/stock-reserved.event";
import { stockUpdatedEvent } from "../../domain/events/stock-updated.event";
import type {
  InventoryListQuery,
  InventoryRepository,
  ReservationActionInput,
  StockMovementInput,
  StockMovementRecord,
  StockReservationInput,
  StockReservationRecord,
} from "../../domain/repositories/inventory.repository";
import { Quantity } from "../../domain/value-objects/quantity.vo";

const number = (value: Prisma.Decimal): number => value.toNumber();
const stockLevel = (row: { quantity: Prisma.Decimal; reserved: Prisma.Decimal }) =>
  new StockLevel(number(row.quantity), number(row.reserved));

type Mutation<T> = { result: T; events: DomainEvent[] };

export interface PrismaInventoryRepositoryOptions {
  /** Executado após cada commit que gravou eventos (acorda o relay do outbox). */
  onEventsCommitted?: () => void;
}

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaInventoryRepositoryOptions = {},
  ) {}

  async list(input: InventoryListQuery) {
    const { page, pageSize, skip, take } = pagination(input.page, input.pageSize);
    const where: Prisma.StockLevelWhereInput = {
      product: {
        isActive: true,
        deletedAt: null,
        ...(input.sku ? { sku: { contains: input.sku, mode: "insensitive" } } : {}),
        // `q` procura no SKU ou no nome do produto.
        ...(input.q
          ? {
              OR: [
                { sku: { contains: input.q, mode: "insensitive" } },
                { name: { contains: input.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      warehouse: { isActive: true },
      ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockLevel.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: [{ product: { sku: "asc" } }, { warehouse: { code: "asc" } }],
        skip,
        take,
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    return {
      items: rows.map((row) => {
        const level = stockLevel(row);
        const minStock = number(row.product.minStock);
        return {
          stockLevelId: row.id,
          productId: row.productId,
          sku: row.product.sku,
          productName: row.product.name,
          unit: row.product.unit,
          warehouseId: row.warehouseId,
          warehouseName: row.warehouse.name,
          quantity: level.quantity,
          reserved: level.reserved,
          available: level.available,
          minStock,
          status: level.status(minStock),
          updatedAt: row.updatedAt.toISOString(),
        };
      }),
      page,
      pageSize,
      total,
    };
  }

  async findReservationByTransaction(transactionId: string): Promise<ReservationSnapshot> {
    return this.prisma.$transaction(
      async (transaction) => {
        const reservation = await transaction.stockReservation.findUnique({
          where: { transactionId },
        });
        if (!reservation) return { status: "NOT_FOUND" };
        if (reservation.status === "COMMITTED") {
          const movement = await transaction.stockMovement.findFirst({
            where: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
              referenceId: `SAGA:${reservation.id}`,
              referenceType: "TEMPORAL_SAGA",
            },
            select: { id: true },
          });
          if (!movement)
            throw new AppError(
              "Movimento da reserva confirmada não encontrado.",
              409,
              "RESERVATION_BALANCE_CONFLICT",
            );
          return { status: "COMMITTED", reservationId: reservation.id, movementId: movement.id };
        }
        return { status: reservation.status, reservationId: reservation.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async listWarehouses() {
    const rows = await this.prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return rows.map(({ id, code, name, address, isActive }) => ({
      id,
      code,
      name,
      address,
      isActive,
    }));
  }

  async listMovements(stockLevelId: string, requestedPage: number, requestedPageSize: number) {
    const stock = await this.prisma.stockLevel.findUnique({ where: { id: stockLevelId } });
    if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");
    const { page, pageSize, skip, take } = pagination(requestedPage, requestedPageSize);
    const where = { productId: stock.productId, warehouseId: stock.warehouseId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: { product: { select: { sku: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return {
      items: rows.map((row) => this.mapMovement(row, stockLevelId)),
      page,
      pageSize,
      total,
    };
  }

  async createMovement(input: StockMovementInput): Promise<StockMovementRecord> {
    return this.mutate(async (transaction) => {
      const stock = await transaction.stockLevel.findUnique({
        where: { id: input.stockLevelId },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");

      const previousQuantity = number(stock.quantity);
      const resultingQuantity = stockLevel(stock).applyMovement(input.type, input.quantity);
      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { quantity: resultingQuantity, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError(
          "O saldo foi alterado por outra operação. Tente novamente.",
          409,
          "STOCK_CONFLICT",
        );
      }

      const movement = await transaction.stockMovement.create({
        data: {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          type: input.type,
          quantity: input.quantity,
          previousQty: previousQuantity,
          resultingQty: resultingQuantity,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          notes: input.notes,
          performedBy: input.actorId,
        },
        include: { product: { select: { sku: true } } },
      });
      const record = this.mapMovement(movement, stock.id);
      return {
        result: record,
        events: [stockUpdatedEvent(record, input.actorId, input.correlationId)],
      };
    });
  }

  async createReservation(input: StockReservationInput): Promise<StockReservationRecord> {
    const quantity = Quantity.positive(input.quantity);
    return this.mutate(async (transaction) => {
      if (input.transactionId) {
        const existing = await transaction.stockReservation.findUnique({
          where: { transactionId: input.transactionId },
        });
        if (existing) {
          const stock = await transaction.stockLevel.findUnique({
            where: {
              productId_warehouseId: {
                productId: existing.productId,
                warehouseId: existing.warehouseId,
              },
            },
            include: { product: { select: { sku: true } } },
          });
          if (
            !stock ||
            existing.status !== "ACTIVE" ||
            stock.id !== input.stockLevelId ||
            number(existing.quantity) !== input.quantity
          ) {
            throw new AppError(
              "A transação já possui uma reserva diferente ou encerrada.",
              409,
              "RESERVATION_CONFLICT",
            );
          }
          return { result: this.mapReservation(existing, stock.id, stock.product.sku), events: [] };
        }
      }
      const stock = await transaction.stockLevel.findUnique({
        where: { id: input.stockLevelId },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");
      stockLevel(stock).assertCanReserve(quantity);

      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { reserved: { increment: input.quantity }, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError(
          "O saldo foi alterado por outra operação. Tente novamente.",
          409,
          "STOCK_CONFLICT",
        );
      }
      const reservation = await transaction.stockReservation.create({
        data: {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          quantity: input.quantity,
          transactionId: input.transactionId,
          expiresAt: input.expiresAt,
        },
      });
      const record = this.mapReservation(reservation, stock.id, stock.product.sku);
      return {
        result: record,
        events: [
          stockReservationEvent(
            "Inventory.StockReserved",
            record,
            input.actorId,
            input.correlationId,
          ),
        ],
      };
    });
  }

  async releaseReservation(input: ReservationActionInput): Promise<StockReservationRecord> {
    return this.mutate(async (transaction) => {
      const reservation = await transaction.stockReservation.findUnique({
        where: { id: input.reservationId },
      });
      if (!reservation) throw new NotFoundError("Reserva de estoque não encontrada.");
      if (reservation.status === "RELEASED") {
        const stock = await transaction.stockLevel.findUnique({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          include: { product: { select: { sku: true } } },
        });
        if (!stock) throw new NotFoundError("Saldo relacionado à reserva não encontrado.");
        return {
          result: this.mapReservation(reservation, stock.id, stock.product.sku),
          events: [],
        };
      }
      if (reservation.status !== "ACTIVE") {
        throw new AppError("A reserva não está ativa.", 409, "RESERVATION_NOT_ACTIVE");
      }
      const stock = await transaction.stockLevel.findUnique({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo relacionado à reserva não encontrado.");
      stockLevel(stock).assertCanRelease(Quantity.positive(number(reservation.quantity)));

      const changed = await transaction.stockReservation.updateMany({
        where: { id: reservation.id, status: "ACTIVE" },
        data: { status: "RELEASED" },
      });
      if (changed.count !== 1) {
        throw new AppError(
          "A reserva foi alterada por outra operação.",
          409,
          "RESERVATION_CONFLICT",
        );
      }
      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { reserved: { decrement: reservation.quantity }, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError(
          "O saldo foi alterado por outra operação. Tente novamente.",
          409,
          "STOCK_CONFLICT",
        );
      }
      const record = this.mapReservation(
        { ...reservation, status: "RELEASED" },
        stock.id,
        stock.product.sku,
      );
      return {
        result: record,
        events: [
          stockReservationEvent(
            "Inventory.StockReleased",
            record,
            input.actorId,
            input.correlationId,
          ),
        ],
      };
    });
  }

  async commitReservation(input: ReservationActionInput): Promise<StockMovementRecord> {
    return this.mutate(async (transaction) => {
      const reservation = await transaction.stockReservation.findUnique({
        where: { id: input.reservationId },
      });
      if (!reservation) throw new NotFoundError("Reserva de estoque não encontrada.");
      const stock = await transaction.stockLevel.findUnique({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo relacionado à reserva não encontrado.");
      const referenceId = `SAGA:${reservation.id}`;
      if (reservation.status === "COMMITTED") {
        const existing = await transaction.stockMovement.findFirst({
          where: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
            referenceId,
          },
          include: { product: { select: { sku: true } } },
        });
        if (!existing)
          throw new AppError(
            "Movimento da reserva confirmada não encontrado.",
            409,
            "RESERVATION_BALANCE_CONFLICT",
          );
        return { result: this.mapMovement(existing, stock.id), events: [] };
      }
      if (reservation.status !== "ACTIVE")
        throw new AppError("A reserva não está ativa.", 409, "RESERVATION_NOT_ACTIVE");
      const quantity = number(reservation.quantity);
      stockLevel(stock).assertCanCommit(Quantity.positive(quantity));
      const changed = await transaction.stockReservation.updateMany({
        where: { id: reservation.id, status: "ACTIVE" },
        data: { status: "COMMITTED" },
      });
      if (changed.count !== 1)
        throw new AppError(
          "A reserva foi alterada por outra operação.",
          409,
          "RESERVATION_CONFLICT",
        );
      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: {
          quantity: { decrement: quantity },
          reserved: { decrement: quantity },
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1)
        throw new AppError("O saldo foi alterado por outra operação.", 409, "STOCK_CONFLICT");
      const movement = await transaction.stockMovement.create({
        data: {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          type: "OUTBOUND",
          quantity,
          previousQty: stock.quantity,
          resultingQty: number(stock.quantity) - quantity,
          referenceId,
          referenceType: "TEMPORAL_SAGA",
          performedBy: input.actorId,
        },
        include: { product: { select: { sku: true } } },
      });
      const record = this.mapMovement(movement, stock.id);
      return {
        result: record,
        events: [stockUpdatedEvent(record, input.actorId, input.correlationId)],
      };
    });
  }

  /**
   * Transação serializável que grava o estado e os eventos no outbox no mesmo
   * commit (Transactional Outbox). Conflitos de serialização viram 409 (P2034).
   */
  private async mutate<T>(
    run: (transaction: Prisma.TransactionClient) => Promise<Mutation<T>>,
  ): Promise<T> {
    const { result, events } = await this.prisma.$transaction(
      async (transaction) => {
        const mutation = await run(transaction);
        await enqueueEvents(transaction, mutation.events);
        return mutation;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (events.length > 0) this.options.onEventsCommitted?.();
    return result;
  }

  private mapMovement(
    row: {
      id: string;
      productId: string;
      warehouseId: string;
      type: string;
      quantity: Prisma.Decimal;
      previousQty: Prisma.Decimal;
      resultingQty: Prisma.Decimal;
      referenceId: string | null;
      referenceType: string | null;
      notes: string | null;
      performedBy: string;
      createdAt: Date;
      product: { sku: string };
    },
    stockLevelId: string,
  ): StockMovementRecord {
    return {
      id: row.id,
      stockLevelId,
      productId: row.productId,
      sku: row.product.sku,
      warehouseId: row.warehouseId,
      type: row.type,
      quantity: number(row.quantity),
      previousQuantity: number(row.previousQty),
      resultingQuantity: number(row.resultingQty),
      referenceId: row.referenceId,
      referenceType: row.referenceType,
      notes: row.notes,
      performedBy: row.performedBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapReservation(
    row: {
      id: string;
      productId: string;
      warehouseId: string;
      quantity: Prisma.Decimal;
      status: string;
      transactionId: string | null;
      expiresAt: Date | null;
      createdAt: Date;
    },
    stockLevelId: string,
    sku: string,
  ): StockReservationRecord {
    return {
      id: row.id,
      stockLevelId,
      productId: row.productId,
      sku,
      warehouseId: row.warehouseId,
      quantity: number(row.quantity),
      status: row.status,
      transactionId: row.transactionId,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
