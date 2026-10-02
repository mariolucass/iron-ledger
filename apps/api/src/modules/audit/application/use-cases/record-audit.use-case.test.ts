import { describe, expect, it } from "vitest";
import type { AuditLog, NewAuditLog } from "../../domain/entities/audit-log.entity";
import type { AuditQuery, AuditRepository } from "../../domain/repositories/audit.repository";
import { RecordAuditUseCase } from "./record-audit.use-case";

class MemoryAuditRepository implements AuditRepository {
  entries = new Map<string, AuditLog>();

  async createIfAbsent(entry: NewAuditLog): Promise<AuditLog> {
    const existing = this.entries.get(entry.eventId);
    if (existing) return existing;
    const saved = { ...entry, id: `audit-${this.entries.size + 1}`, actorEmail: null };
    this.entries.set(entry.eventId, saved);
    return saved;
  }

  async query(_input: AuditQuery) {
    return { items: [...this.entries.values()], page: 1, pageSize: 20, total: this.entries.size };
  }
}

describe("RecordAuditUseCase", () => {
  it("transforma evento de estoque em auditoria e é idempotente por eventId", async () => {
    const repository = new MemoryAuditRepository();
    const useCase = new RecordAuditUseCase(repository);
    const event = {
      eventId: "event-1",
      eventName: "Inventory.StockUpdated",
      occurredAt: "2026-09-24T00:00:00.000Z",
      aggregateId: "stock-1",
      actorId: "10000000-0000-4000-8000-000000000001",
      payload: { entityType: "Inventory", entityId: "stock-1", action: "UPDATE", correlationId: "corr-1" },
    };

    const first = await useCase.execute(event);
    const repeated = await useCase.execute(event);

    expect(first).toEqual(repeated);
    expect(repository.entries.size).toBe(1);
    expect(first).toMatchObject({ entityType: "Inventory", entityId: "stock-1", action: "UPDATE", correlationId: "corr-1" });
  });
});
