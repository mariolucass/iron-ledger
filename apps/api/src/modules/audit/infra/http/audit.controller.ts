import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { QueryAuditUseCase } from "../../application/use-cases/query-audit.use-case";

const querySchema = z.object({
  eventName: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  actor: z.string().trim().min(1).optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "LOGIN", "PERMISSION_CHANGE"]).optional(),
  correlationId: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "O período inicial deve ser anterior ao período final.",
});

export class AuditController {
  constructor(private readonly queryAudit: QueryAuditUseCase) {}

  list = async (request: Request, response: Response, next: NextFunction) => {
    try {
      response.json(await this.queryAudit.execute(querySchema.parse(request.query)));
    } catch (error) { next(error); }
  };
}
