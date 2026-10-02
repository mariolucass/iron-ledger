import { describe, expect, it, vi } from "vitest";
import type { InventoryRepository, StockMovementRecord } from "../../domain/repositories/inventory.repository";
import { CommitReservationUseCase } from "./commit-reservation.use-case";

const movement: StockMovementRecord = {
  id: "50000000-0000-4000-8000-000000000099",
  stockLevelId: "30000000-0000-4000-8000-000000000001",
  productId: "20000000-0000-4000-8000-000000000001",
  sku: "SKU-4821-A",
  warehouseId: "10000000-0000-4000-8000-000000000001",
  type: "OUTBOUND",
  quantity: 1,
  previousQuantity: 3,
  resultingQuantity: 2,
  referenceId: "SAGA:40000000-0000-4000-8000-000000000099",
  referenceType: "TEMPORAL_SAGA",
  notes: null,
  performedBy: "60000000-0000-4000-8000-000000000001",
  createdAt: "2026-10-02T00:00:00.000Z",
};

describe("CommitReservationUseCase", () => {
  it("republica o mesmo ID de evento quando a confirmação é repetida", async () => {
    const commitReservation = vi.fn().mockResolvedValueOnce({ movement, committed: true })
      .mockResolvedValueOnce({ movement, committed: false });
    const publish = vi.fn().mockResolvedValue(undefined);
    const useCase = new CommitReservationUseCase(
      { commitReservation } as unknown as InventoryRepository,
      { publish },
    );
    const input = {
      reservationId: "40000000-0000-4000-8000-000000000099",
      actorId: movement.performedBy,
    };

    await useCase.execute(input);
    await useCase.execute(input);

    expect(commitReservation).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish.mock.calls[0]?.[0].eventId).toBe(`Inventory.StockUpdated:${movement.id}`);
    expect(publish.mock.calls[1]?.[0].eventId).toBe(publish.mock.calls[0]?.[0].eventId);
  });
});
