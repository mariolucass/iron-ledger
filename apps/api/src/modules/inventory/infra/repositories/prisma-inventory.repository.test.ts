import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findReservation: vi.fn(), findMovement: vi.fn(), transaction: vi.fn(),
}));
vi.mock("../../../../infra/database/prisma.client", () => ({ prisma: { $transaction: mocks.transaction } }));
import { PrismaInventoryRepository } from "./prisma-inventory.repository";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (run) => run({
    stockReservation: { findUnique: mocks.findReservation },
    stockMovement: { findFirst: mocks.findMovement },
  }));
});

describe("reservation reconciliation read model", () => {
  it("reports missing transactions without inventing a rollback result", async () => {
    mocks.findReservation.mockResolvedValue(null);
    expect(await new PrismaInventoryRepository().findReservationByTransaction("tx")).toEqual({status:"NOT_FOUND"});
    expect(mocks.findReservation).toHaveBeenCalledWith({where:{transactionId:"tx"}});
  });

  it.each(["ACTIVE", "RELEASED", "EXPIRED"])("returns %s reservations without searching for a movement", async (status) => {
    mocks.findReservation.mockResolvedValue({id:"reservation",status});
    expect(await new PrismaInventoryRepository().findReservationByTransaction("tx")).toEqual({status,reservationId:"reservation"});
    expect(mocks.findMovement).not.toHaveBeenCalled();
  });

  it("links a committed reservation to the existing saga movement", async () => {
    mocks.findReservation.mockResolvedValue({id:"reservation",status:"COMMITTED",productId:"product",warehouseId:"warehouse"});
    mocks.findMovement.mockResolvedValue({id:"movement"});
    expect(await new PrismaInventoryRepository().findReservationByTransaction("tx")).toEqual({status:"COMMITTED",reservationId:"reservation",movementId:"movement"});
    expect(mocks.findMovement).toHaveBeenCalledWith({where:{productId:"product",warehouseId:"warehouse",referenceId:"SAGA:reservation",referenceType:"TEMPORAL_SAGA"},select:{id:true}});
  });

  it("rejects inconsistent committed state", async () => {
    mocks.findReservation.mockResolvedValue({id:"reservation",status:"COMMITTED"});
    mocks.findMovement.mockResolvedValue(null);
    await expect(new PrismaInventoryRepository().findReservationByTransaction("tx")).rejects.toMatchObject({code:"RESERVATION_BALANCE_CONFLICT"});
  });
});
