import { Prisma, type PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaInventoryRepository } from "./prisma-inventory.repository";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findReservation: vi.fn(),
  updateReservation: vi.fn(),
  findMovement: vi.fn(),
  createMovement: vi.fn(),
  findStock: vi.fn(),
  updateStock: vi.fn(),
  enqueue: vi.fn(),
  wake: vi.fn(),
}));

const decimal = (value: number) => new Prisma.Decimal(value);
const ACTOR = "60000000-0000-4000-8000-000000000001";
const stock = {
  id: "30000000-0000-4000-8000-000000000001",
  productId: "20000000-0000-4000-8000-000000000001",
  warehouseId: "10000000-0000-4000-8000-000000000001",
  quantity: decimal(10),
  reserved: decimal(3),
  version: 4,
  product: { sku: "SKU-4821-A" },
};
const movementRow = (overrides: Record<string, unknown> = {}) => ({
  id: "50000000-0000-4000-8000-000000000099",
  productId: stock.productId,
  warehouseId: stock.warehouseId,
  type: "OUTBOUND",
  quantity: decimal(2),
  previousQty: decimal(10),
  resultingQty: decimal(8),
  referenceId: null,
  referenceType: null,
  notes: null,
  performedBy: ACTOR,
  createdAt: new Date("2026-10-02T00:00:00.000Z"),
  product: { sku: stock.product.sku },
  ...overrides,
});

const repository = () =>
  new PrismaInventoryRepository({ $transaction: mocks.transaction } as unknown as PrismaClient, {
    onEventsCommitted: mocks.wake,
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (run) =>
    run({
      stockReservation: { findUnique: mocks.findReservation, updateMany: mocks.updateReservation },
      stockMovement: { findFirst: mocks.findMovement, create: mocks.createMovement },
      stockLevel: { findUnique: mocks.findStock, updateMany: mocks.updateStock },
      outboxEvent: { createMany: mocks.enqueue },
    }),
  );
});

describe("reservation reconciliation read model", () => {
  it("reports missing transactions without inventing a rollback result", async () => {
    mocks.findReservation.mockResolvedValue(null);
    expect(await repository().findReservationByTransaction("tx")).toEqual({ status: "NOT_FOUND" });
    expect(mocks.findReservation).toHaveBeenCalledWith({ where: { transactionId: "tx" } });
  });

  it.each(["ACTIVE", "RELEASED", "EXPIRED"])(
    "returns %s reservations without searching for a movement",
    async (status) => {
      mocks.findReservation.mockResolvedValue({ id: "reservation", status });
      expect(await repository().findReservationByTransaction("tx")).toEqual({
        status,
        reservationId: "reservation",
      });
      expect(mocks.findMovement).not.toHaveBeenCalled();
    },
  );

  it("links a committed reservation to the existing saga movement", async () => {
    mocks.findReservation.mockResolvedValue({
      id: "reservation",
      status: "COMMITTED",
      productId: "product",
      warehouseId: "warehouse",
    });
    mocks.findMovement.mockResolvedValue({ id: "movement" });
    expect(await repository().findReservationByTransaction("tx")).toEqual({
      status: "COMMITTED",
      reservationId: "reservation",
      movementId: "movement",
    });
    expect(mocks.findMovement).toHaveBeenCalledWith({
      where: {
        productId: "product",
        warehouseId: "warehouse",
        referenceId: "SAGA:reservation",
        referenceType: "TEMPORAL_SAGA",
      },
      select: { id: true },
    });
  });

  it("rejects inconsistent committed state", async () => {
    mocks.findReservation.mockResolvedValue({ id: "reservation", status: "COMMITTED" });
    mocks.findMovement.mockResolvedValue(null);
    await expect(repository().findReservationByTransaction("tx")).rejects.toMatchObject({
      code: "RESERVATION_BALANCE_CONFLICT",
    });
  });
});

describe("transactional outbox", () => {
  it("grava o movimento e o evento no mesmo commit e acorda o relay", async () => {
    mocks.findStock.mockResolvedValue(stock);
    mocks.updateStock.mockResolvedValue({ count: 1 });
    mocks.createMovement.mockResolvedValue(movementRow());

    const movement = await repository().createMovement({
      stockLevelId: stock.id,
      type: "OUTBOUND",
      quantity: 2,
      actorId: ACTOR,
      correlationId: "corr-1",
    });

    expect(movement.resultingQuantity).toBe(8);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.updateStock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: stock.id, version: stock.version },
        data: expect.objectContaining({ quantity: 8 }),
      }),
    );
    const [
      {
        data: [event],
      },
    ] = mocks.enqueue.mock.calls[0]!;
    expect(event).toMatchObject({
      eventName: "Inventory.StockUpdated",
      aggregateId: stock.id,
      correlationId: "corr-1",
      payload: expect.objectContaining({ movementId: movement.id, resultingQuantity: 8 }),
    });
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.wake).toHaveBeenCalledTimes(1);
  });

  it("não grava nada nem acorda o relay quando a baixa invade o reservado", async () => {
    mocks.findStock.mockResolvedValue(stock);

    await expect(
      repository().createMovement({
        stockLevelId: stock.id,
        type: "OUTBOUND",
        quantity: 8,
        actorId: ACTOR,
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });

    expect(mocks.updateStock).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(mocks.wake).not.toHaveBeenCalled();
  });

  it("repetir a confirmação devolve o movimento original sem novo evento", async () => {
    const reservationId = "40000000-0000-4000-8000-000000000099";
    mocks.findReservation.mockResolvedValue({
      id: reservationId,
      status: "COMMITTED",
      productId: stock.productId,
      warehouseId: stock.warehouseId,
      quantity: decimal(2),
    });
    mocks.findStock.mockResolvedValue(stock);
    mocks.findMovement.mockResolvedValue(
      movementRow({ referenceId: `SAGA:${reservationId}`, referenceType: "TEMPORAL_SAGA" }),
    );

    const movement = await repository().commitReservation({ reservationId, actorId: ACTOR });

    expect(movement.referenceId).toBe(`SAGA:${reservationId}`);
    expect(mocks.updateStock).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(mocks.wake).not.toHaveBeenCalled();
  });
});
