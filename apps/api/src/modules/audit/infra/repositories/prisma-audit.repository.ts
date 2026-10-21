import { Prisma } from "@prisma/client";
import { prisma } from "../../../../infra/database/prisma.client";
import { pagination } from "../../../../shared/utils/pagination";
import type { AuditLog, NewAuditLog } from "../../domain/entities/audit-log.entity";
import type { AuditQuery, AuditRepository } from "../../domain/repositories/audit.repository";

export class PrismaAuditRepository implements AuditRepository {
  async createIfAbsent(entry: NewAuditLog): Promise<AuditLog> {
    const validActorId = entry.actorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.actorId)
      ? entry.actorId
      : null;
    const knownActor = validActorId
      ? await prisma.user.findUnique({ where: { id: validActorId }, select: { email: true } })
      : null;
    // ON CONFLICT DO NOTHING: retries never UPDATE an immutable audit row.
    await prisma.auditLog.createMany({
      skipDuplicates: true,
      data: {
        eventId: entry.eventId,
        eventName: entry.eventName,
        occurredAt: new Date(entry.occurredAt),
        actorId: validActorId,
        actorEmail: knownActor?.email,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        correlationId: entry.correlationId,
        payload: entry.payload as Prisma.InputJsonObject,
      },
    });
    const row = await prisma.auditLog.findUniqueOrThrow({ where: { eventId: entry.eventId } });
    return this.map(row);
  }

  async query(input: AuditQuery) {
    const { page, pageSize, skip, take } = pagination(input.page, input.pageSize);
    const actorId = input.actor && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.actor)
      ? input.actor
      : undefined;
    const actorFilters: Prisma.AuditLogWhereInput[] | undefined = input.actor
      ? actorId
        ? [{ actorId }, { actorEmail: { contains: input.actor, mode: "insensitive" } }]
        : [{ actorEmail: { contains: input.actor, mode: "insensitive" } }]
      : undefined;
    const where: Prisma.AuditLogWhereInput = {
      ...(input.eventName ? { eventName: { contains: input.eventName, mode: "insensitive" } } : {}),
      ...(input.entityType ? { entityType: { equals: input.entityType, mode: "insensitive" } } : {}),
      ...(input.entityId ? { entityId: { contains: input.entityId, mode: "insensitive" } } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.correlationId ? { correlationId: { contains: input.correlationId, mode: "insensitive" } } : {}),
      ...(actorFilters ? { OR: actorFilters } : {}),
      ...(input.from || input.to
        ? { occurredAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) } }
        : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items: rows.map((row) => this.map(row)), page, pageSize, total };
  }

  private map(row: {
    id: string; eventId: string; eventName: string; occurredAt: Date; actorId: string | null;
    entityType: string; entityId: string; action: string; correlationId: string | null;
    payload: Prisma.JsonValue; actorEmail: string | null;
  }): AuditLog {
    return {
      id: row.id,
      eventId: row.eventId,
      eventName: row.eventName,
      occurredAt: row.occurredAt.toISOString(),
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action as AuditLog["action"],
      correlationId: row.correlationId,
      payload: row.payload as Record<string, unknown>,
    };
  }
}
