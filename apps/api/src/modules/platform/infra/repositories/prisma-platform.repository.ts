import { Prisma } from "@prisma/client";
import { prisma } from "../../../../infra/database/prisma.client";
import { AppError } from "../../../../shared/errors/domain.error";
import type { FlagInput, PlatformRepository, PlatformSection } from "../../application/platform";
const iso = (value: Date | null) => value?.toISOString() ?? null;
const pageOf = <T>(items: T[], total: number, page: number, pageSize: number) => ({
  items,
  total,
  page,
  pageSize,
});

export class PrismaPlatformRepository implements PlatformRepository {
  async overview() {
    const [outbox, inbox, flags, settings, idempotency] = await Promise.all([
      prisma.outboxEvent.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.inboxMessage.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.featureFlag.count(),
      prisma.setting.count({ where: { isSecret: false } }),
      prisma.idempotencyKey.count(),
    ]);
    return {
      outbox: Object.fromEntries(outbox.map((row) => [row.status, row._count._all])),
      inbox: Object.fromEntries(inbox.map((row) => [row.status, row._count._all])),
      featureFlags: flags,
      visibleSettings: settings,
      idempotencyKeys: idempotency,
    };
  }
  async list(section: PlatformSection, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    switch (section) {
      case "outbox": {
        const [total, rows] = await prisma.$transaction([
          prisma.outboxEvent.count(),
          prisma.outboxEvent.findMany({
            orderBy: { sequence: "desc" },
            skip,
            take: pageSize,
            select: {
              id: true,
              sequence: true,
              eventName: true,
              aggregateType: true,
              aggregateId: true,
              status: true,
              attempts: true,
              lastError: true,
              occurredAt: true,
              publishedAt: true,
            },
          }),
        ]);
        return pageOf(
          rows.map((row) => ({
            ...row,
            sequence: row.sequence.toString(),
            occurredAt: row.occurredAt.toISOString(),
            publishedAt: iso(row.publishedAt),
          })),
          total,
          page,
          pageSize,
        );
      }
      case "inbox": {
        const [total, rows] = await prisma.$transaction([
          prisma.inboxMessage.count(),
          prisma.inboxMessage.findMany({
            orderBy: { receivedAt: "desc" },
            skip,
            take: pageSize,
            select: {
              id: true,
              messageId: true,
              consumer: true,
              eventName: true,
              status: true,
              attempts: true,
              lastError: true,
              receivedAt: true,
              processedAt: true,
            },
          }),
        ]);
        return pageOf(
          rows.map((row) => ({
            ...row,
            receivedAt: row.receivedAt.toISOString(),
            processedAt: iso(row.processedAt),
          })),
          total,
          page,
          pageSize,
        );
      }
      case "idempotency-keys": {
        const [total, rows] = await prisma.$transaction([
          prisma.idempotencyKey.count(),
          prisma.idempotencyKey.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
            select: {
              id: true,
              key: true,
              scope: true,
              status: true,
              responseStatus: true,
              createdAt: true,
              expiresAt: true,
            },
          }),
        ]);
        return pageOf(
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            expiresAt: row.expiresAt.toISOString(),
          })),
          total,
          page,
          pageSize,
        );
      }
      case "settings": {
        const where = { isSecret: false };
        const [total, rows] = await prisma.$transaction([
          prisma.setting.count({ where }),
          prisma.setting.findMany({
            where,
            orderBy: [{ scope: "asc" }, { key: "asc" }],
            skip,
            take: pageSize,
            select: {
              id: true,
              scope: true,
              scopeId: true,
              key: true,
              value: true,
              description: true,
              version: true,
              updatedAt: true,
            },
          }),
        ]);
        return pageOf(
          rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() })),
          total,
          page,
          pageSize,
        );
      }
      case "feature-flags": {
        const [total, rows] = await prisma.$transaction([
          prisma.featureFlag.count(),
          prisma.featureFlag.findMany({ orderBy: { key: "asc" }, skip, take: pageSize }),
        ]);
        return pageOf(
          rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          })),
          total,
          page,
          pageSize,
        );
      }
    }
  }
  async outbox(id: string) {
    const row = await prisma.outboxEvent.findUnique({ where: { id } });
    return (
      row && {
        ...row,
        sequence: row.sequence.toString(),
        occurredAt: row.occurredAt.toISOString(),
        availableAt: row.availableAt.toISOString(),
        lockedUntil: iso(row.lockedUntil),
        publishedAt: iso(row.publishedAt),
      }
    );
  }
  async flag(id: string) {
    const row = await prisma.featureFlag.findUnique({ where: { id } });
    return (
      row && {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    );
  }
  async createFlag(input: FlagInput, actorId: string) {
    try {
      const row = await prisma.featureFlag.create({
        data: {
          key: input.key,
          description: input.description,
          isEnabled: input.isEnabled,
          rollout: input.rollout,
          rules: (input.rules as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          updatedBy: actorId,
        },
        select: { id: true },
      });
      return this.flag(row.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new AppError("Já existe uma flag com essa chave.", 409, "FLAG_EXISTS");
      throw error;
    }
  }
  async updateFlag(id: string, input: Partial<FlagInput>, actorId: string) {
    if (!(await prisma.featureFlag.findUnique({ where: { id }, select: { id: true } })))
      return null;
    try {
      await prisma.featureFlag.update({
        where: { id },
        data: {
          key: input.key,
          description: input.description,
          isEnabled: input.isEnabled,
          rollout: input.rollout,
          ...(input.rules !== undefined
            ? { rules: (input.rules as Prisma.InputJsonValue) ?? Prisma.JsonNull }
            : {}),
          updatedBy: actorId,
        },
      });
      return this.flag(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        throw new AppError("Já existe uma flag com essa chave.", 409, "FLAG_EXISTS");
      throw error;
    }
  }
}
