import { Prisma } from "@prisma/client";
import { prisma } from "../../../../infra/database/prisma.client";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { pagination } from "../../../../shared/utils/pagination";
import type { ReleaseStockDto, ReserveStockDto } from "../../application/dtos/reserve-stock.dto";
import type { UpdateStockDto } from "../../application/dtos/update-stock.dto";
import type {
  InventoryRepository,
  StockMovementRecord,
  StockReservationRecord,
} from "../../domain/repositories/inventory.repository";
import {
  assertResultingBalance,
  availableQuantity,
  inventoryStatus,
  movementDelta,
} from "../../domain/services/inventory-domain.service";

const number = (value: Prisma.Decimal): number => value.toNumber();

export class PrismaInventoryRepository implements InventoryRepository {
  async list(input: { sku?: string; warehouseId?: string; page: number; pageSize: number }) {
    const { page, pageSize, skip, take } = pagination(input.page, input.pageSize);
    const where: Prisma.StockLevelWhereInput = {
      product: {
        isActive: true,
        deletedAt: null,
        ...(input.sku ? { sku: { contains: input.sku, mode: "insensitive" } } : {}),
      },
      warehouse: { isActive: true },
      ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.stockLevel.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: [{ product: { sku: "asc" } }, { warehouse: { code: "asc" } }],
        skip,
        take,
      }),
      prisma.stockLevel.count({ where }),
    ]);

    return {
      items: rows.map((row) => {
        const quantity = number(row.quantity);
        const reserved = number(row.reserved);
        const minStock = number(row.product.minStock);
        const available = availableQuantity(quantity, reserved);
        return {
          stockLevelId: row.id,
          productId: row.productId,
          sku: row.product.sku,
          productName: row.product.name,
          unit: row.product.unit,
          warehouseId: row.warehouseId,
          warehouseName: row.warehouse.name,
          quantity,
          reserved,
          available,
          minStock,
          status: inventoryStatus(available, minStock),
          updatedAt: row.updatedAt.toISOString(),
        };
      }),
      page,
      pageSize,
      total,
    };
  }

  async listWarehouses() {
    const rows = await prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
    return rows.map(({ id, code, name, address, isActive }) => ({ id, code, name, address, isActive }));
  }

  async listMovements(stockLevelId: string, requestedPage: number, requestedPageSize: number) {
    const stock = await prisma.stockLevel.findUnique({ where: { id: stockLevelId } });
    if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");
    const { page, pageSize, skip, take } = pagination(requestedPage, requestedPageSize);
    const where = { productId: stock.productId, warehouseId: stock.warehouseId };
    const [rows, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        include: { product: { select: { sku: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return {
      items: rows.map((row) => this.mapMovement(row, stockLevelId)),
      page,
      pageSize,
      total,
    };
  }

  async createMovement(input: UpdateStockDto): Promise<StockMovementRecord> {
    return prisma.$transaction(async (transaction) => {
      const stock = await transaction.stockLevel.findUnique({
        where: { id: input.stockLevelId },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");

      const previousQuantity = number(stock.quantity);
      const delta = movementDelta(input.type, input.quantity);
      const resultingQuantity = assertResultingBalance(previousQuantity, number(stock.reserved), delta);
      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { quantity: resultingQuantity, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError("O saldo foi alterado por outra operação. Tente novamente.", 409, "STOCK_CONFLICT");
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
      return this.mapMovement(movement, stock.id);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createReservation(input: ReserveStockDto): Promise<StockReservationRecord> {
    return prisma.$transaction(async (transaction) => {
      if (input.transactionId) {
        const existing = await transaction.stockReservation.findUnique({ where: { transactionId: input.transactionId } });
        if (existing) {
          const stock = await transaction.stockLevel.findUnique({
            where: { productId_warehouseId: { productId: existing.productId, warehouseId: existing.warehouseId } },
            include: { product: { select: { sku: true } } },
          });
          if (!stock || existing.status !== "ACTIVE" || stock.id !== input.stockLevelId || number(existing.quantity) !== input.quantity) {
            throw new AppError("A transação já possui uma reserva diferente ou encerrada.", 409, "RESERVATION_CONFLICT");
          }
          return this.mapReservation(existing, stock.id, stock.product.sku);
        }
      }
      const stock = await transaction.stockLevel.findUnique({
        where: { id: input.stockLevelId },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");
      if (availableQuantity(number(stock.quantity), number(stock.reserved)) < input.quantity) {
        throw new AppError("Saldo disponível insuficiente para a reserva.", 409, "INSUFFICIENT_STOCK");
      }

      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { reserved: { increment: input.quantity }, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError("O saldo foi alterado por outra operação. Tente novamente.", 409, "STOCK_CONFLICT");
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
      return this.mapReservation(reservation, stock.id, stock.product.sku);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async releaseReservation(input: ReleaseStockDto): Promise<StockReservationRecord> {
    return prisma.$transaction(async (transaction) => {
      const reservation = await transaction.stockReservation.findUnique({ where: { id: input.reservationId } });
      if (!reservation) throw new NotFoundError("Reserva de estoque não encontrada.");
      if (reservation.status === "RELEASED") {
        const stock = await transaction.stockLevel.findUnique({
          where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
          include: { product: { select: { sku: true } } },
        });
        if (!stock) throw new NotFoundError("Saldo relacionado à reserva não encontrado.");
        return this.mapReservation(reservation, stock.id, stock.product.sku);
      }
      if (reservation.status !== "ACTIVE") {
        throw new AppError("A reserva não está ativa.", 409, "RESERVATION_NOT_ACTIVE");
      }
      const stock = await transaction.stockLevel.findUnique({
        where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo relacionado à reserva não encontrado.");
      if (number(stock.reserved) < number(reservation.quantity)) {
        throw new AppError("O saldo reservado está inconsistente.", 409, "RESERVATION_BALANCE_CONFLICT");
      }

      const changed = await transaction.stockReservation.updateMany({
        where: { id: reservation.id, status: "ACTIVE" },
        data: { status: "RELEASED" },
      });
      if (changed.count !== 1) {
        throw new AppError("A reserva foi alterada por outra operação.", 409, "RESERVATION_CONFLICT");
      }
      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { reserved: { decrement: reservation.quantity }, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError("O saldo foi alterado por outra operação. Tente novamente.", 409, "STOCK_CONFLICT");
      }
      return this.mapReservation({ ...reservation, status: "RELEASED" }, stock.id, stock.product.sku);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async commitReservation(input: { reservationId: string; actorId: string }): Promise<{ movement: StockMovementRecord; committed: boolean }> {
    return prisma.$transaction(async (transaction) => {
      const reservation = await transaction.stockReservation.findUnique({ where: { id: input.reservationId } });
      if (!reservation) throw new NotFoundError("Reserva de estoque não encontrada.");
      const stock = await transaction.stockLevel.findUnique({
        where: { productId_warehouseId: { productId: reservation.productId, warehouseId: reservation.warehouseId } },
        include: { product: { select: { sku: true } } },
      });
      if (!stock) throw new NotFoundError("Saldo relacionado à reserva não encontrado.");
      const referenceId = `SAGA:${reservation.id}`;
      if (reservation.status === "COMMITTED") {
        const existing = await transaction.stockMovement.findFirst({
          where: { productId: reservation.productId, warehouseId: reservation.warehouseId, referenceId },
          include: { product: { select: { sku: true } } },
        });
        if (!existing) throw new AppError("Movimento da reserva confirmada não encontrado.", 409, "RESERVATION_BALANCE_CONFLICT");
        return { movement: this.mapMovement(existing, stock.id), committed: false };
      }
      if (reservation.status !== "ACTIVE") throw new AppError("A reserva não está ativa.", 409, "RESERVATION_NOT_ACTIVE");
      const quantity = number(reservation.quantity);
      if (number(stock.reserved) < quantity || number(stock.quantity) < quantity) {
        throw new AppError("O saldo reservado está inconsistente.", 409, "RESERVATION_BALANCE_CONFLICT");
      }
      const changed = await transaction.stockReservation.updateMany({
        where: { id: reservation.id, status: "ACTIVE" }, data: { status: "COMMITTED" },
      });
      if (changed.count !== 1) throw new AppError("A reserva foi alterada por outra operação.", 409, "RESERVATION_CONFLICT");
      const updated = await transaction.stockLevel.updateMany({
        where: { id: stock.id, version: stock.version },
        data: { quantity: { decrement: quantity }, reserved: { decrement: quantity }, version: { increment: 1 } },
      });
      if (updated.count !== 1) throw new AppError("O saldo foi alterado por outra operação.", 409, "STOCK_CONFLICT");
      const movement = await transaction.stockMovement.create({
        data: {
          productId: stock.productId, warehouseId: stock.warehouseId, type: "OUTBOUND", quantity,
          previousQty: stock.quantity, resultingQty: number(stock.quantity) - quantity,
          referenceId, referenceType: "TEMPORAL_SAGA", performedBy: input.actorId,
        },
        include: { product: { select: { sku: true } } },
      });
      return { movement: this.mapMovement(movement, stock.id), committed: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private mapMovement(row: {
    id: string; productId: string; warehouseId: string; type: string; quantity: Prisma.Decimal;
    previousQty: Prisma.Decimal; resultingQty: Prisma.Decimal; referenceId: string | null;
    referenceType: string | null; notes: string | null; performedBy: string; createdAt: Date;
    product: { sku: string };
  }, stockLevelId: string): StockMovementRecord {
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

  private mapReservation(row: {
    id: string; productId: string; warehouseId: string; quantity: Prisma.Decimal; status: string;
    transactionId: string | null; expiresAt: Date | null; createdAt: Date;
  }, stockLevelId: string, sku: string): StockReservationRecord {
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
