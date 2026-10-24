import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import type { PrismaAlertRepository } from "../repositories/prisma-alert.repository";

const idSchema = z.string().uuid();
const statusSchema = z.object({ status: z.enum(["ACKNOWLEDGED", "RESOLVED"]) });

function toAlertDto(alert: Awaited<ReturnType<PrismaAlertRepository["updateStatus"]>>) {
  return {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    status: alert.status,
    title: alert.title,
    message: alert.message,
    entityType: alert.entityType,
    entityId: alert.entityId,
    payload: alert.payload,
    occurrences: alert.occurrences,
    triggeredAt: alert.triggeredAt.toISOString(),
    lastSeenAt: alert.lastSeenAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
  };
}

export class AlertsController {
  constructor(private readonly alerts: PrismaAlertRepository) {}

  list = async (_request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.alerts.list();
      response.json({ ...result, items: result.items.map(toAlertDto) });
    } catch (error) { next(error); }
  };

  update = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const id = idSchema.parse(request.params.id);
      const { status } = statusSchema.parse(request.body);
      const alert = await this.alerts.updateStatus(id, status, request.auth!.userId);
      response.json(toAlertDto(alert));
    } catch (error) { next(error); }
  };

  resolveAll = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const updatedCount = await this.alerts.resolveAll(request.auth!.userId);
      response.json({ updatedCount });
    } catch (error) { next(error); }
  };
}
