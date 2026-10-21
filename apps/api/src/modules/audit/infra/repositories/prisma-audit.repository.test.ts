import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewAuditLog } from "../../domain/entities/audit-log.entity";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), insert: vi.fn(), find: vi.fn(), list: vi.fn(), count: vi.fn(), transaction: vi.fn(),
}));
vi.mock("../../../../infra/database/prisma.client", () => ({ prisma: {
  user: { findUnique: mocks.user },
  auditLog: { createMany: mocks.insert, findUniqueOrThrow: mocks.find, findMany: mocks.list, count: mocks.count },
  $transaction: mocks.transaction,
} }));
import { PrismaAuditRepository } from "./prisma-audit.repository";

const actorId = "7f758c34-d6b5-4a42-b526-93754d244735";
const entry: NewAuditLog = {
  eventId: "event", eventName: "Product.Created", occurredAt: "2026-10-20T12:00:00.000Z",
  actorId, entityType: "Product", entityId: "product", action: "CREATE", correlationId: null, payload: {},
};
const saved = { ...entry, id: "audit", occurredAt: new Date(entry.occurredAt), actorEmail: "original@example.test" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockResolvedValue(saved);
  mocks.insert.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation((queries) => Promise.all(queries));
});

describe("immutable audit repository", () => {
  it("keeps the actor ID when the user no longer exists", async () => {
    mocks.user.mockResolvedValue(null);
    mocks.find.mockResolvedValue({ ...saved, actorEmail: null });
    const result = await new PrismaAuditRepository().createIfAbsent(entry);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      skipDuplicates: true,
      data: expect.objectContaining({ actorId }),
    }));
    expect(result).toMatchObject({ actorId, actorEmail: null });
  });

  it("captures the email once and returns the stored snapshot on duplicate delivery", async () => {
    mocks.user.mockResolvedValue({ email: "changed@example.test" });
    mocks.insert.mockResolvedValue({ count: 0 });
    const result = await new PrismaAuditRepository().createIfAbsent(entry);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      skipDuplicates: true,
      data: expect.objectContaining({ actorId, actorEmail: "changed@example.test" }),
    }));
    expect(result.actorEmail).toBe("original@example.test");
    expect(mocks.find).toHaveBeenCalledWith({ where: { eventId: entry.eventId } });
  });

  it("searches the historical email without joining the current user", async () => {
    mocks.list.mockResolvedValue([saved]);
    mocks.count.mockResolvedValue(1);
    const result = await new PrismaAuditRepository().query({ actor: "original@", page: 1, pageSize: 20 });
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ actorEmail: { contains: "original@", mode: "insensitive" } }] },
    }));
    expect(mocks.user).not.toHaveBeenCalled();
    expect(result.items[0]).toMatchObject({ actorId, actorEmail: "original@example.test" });
    expect(result.total).toBe(1);
  });

  it("supports searching deleted actors by ID", async () => {
    mocks.list.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
    await new PrismaAuditRepository().query({ actor: actorId, page: 1, pageSize: 20 });
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ actorId }, { actorEmail: { contains: actorId, mode: "insensitive" } }] },
    }));
  });
});
