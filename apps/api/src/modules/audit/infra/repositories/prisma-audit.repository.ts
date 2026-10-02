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
      ? await prisma.user.findUnique({ where: { id: validActorId }, select: { id: true } })
      : null;
    const row = await prisma.auditLog.upsert({
      where: { eventId: entry.eventId },
      update: {},
      create: {
        eventId: entry.eventId,
        eventName: entry.eventName,
        occurredAt: new Date(entry.occurredAt),
        actorId: knownActor?.id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        correlationId: entry.correlationId,
        payload: entry.payload as Prisma.InputJsonObject,
      },
      include: { actor: { select: { email: true } } },
    });
    return this.map(row);
  }

  async query(input: AuditQuery) {
    const { page, pageSize, skip, take } = pagination(input.page, input.pageSize);
    const actorId = input.actor && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.actor)
      ? input.actor
      : undefined;
    const actorFilters: Prisma.AuditLogWhereInput[] | undefined = input.actor
      ? actorId
        ? [{ actorId }, { actor: { email: { contains: input.actor, mode: "insensitive" } } }]
        : [{ actor: { email: { contains: input.actor, mode: "insensitive" } } }]
      : undefined;
    const where: Prisma.AuditLogWhereInput = {
      ...(input.eventName ? { eventName: { contains: input.eventName, mode: "insensitive" } } : {}),
      ...(input.entityType ? { entityType: { equals: input.entityType, mode: "insensitive" } } : {}),
      ...(input.entityId ? { entityId: { contains: input.entityId, mode: "insensitive" } } : {}),
      ...(actorFilters ? { OR: actorFilters } : {}),
      ...(input.from || input.to
        ? { occurredAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) } }
        : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { email: true } } },
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
    payload: Prisma.JsonValue; actor: { email: string } | null;
  }): AuditLog {
    return {
      id: row.id,
      eventId: row.eventId,
      eventName: row.eventName,
      occurredAt: row.occurredAt.toISOString(),
      actorId: row.actorId,
      actorEmail: row.actor?.email ?? null,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action as AuditLog["action"],
      correlationId: row.correlationId,
      payload: row.payload as Record<string, unknown>,
    };
  }
}
