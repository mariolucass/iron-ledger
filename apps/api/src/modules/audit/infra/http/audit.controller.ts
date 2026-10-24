import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import type { QueryAuditUseCase } from "../../application/use-cases/query-audit.use-case";
import { pageQueryShape } from "../../../../shared/utils/pagination";

const querySchema = z
  .object({
    eventName: z.string().trim().min(1).optional(),
    entityType: z.string().trim().min(1).optional(),
    entityId: z.string().trim().min(1).optional(),
    actor: z.string().trim().min(1).optional(),
    userActorsOnly: z
      .enum(["true"])
      .transform(() => true)
      .optional(),
    action: z.enum(["CREATE", "UPDATE", "DELETE", "LOGIN", "PERMISSION_CHANGE"]).optional(),
    correlationId: z.string().trim().min(1).max(100).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    ...pageQueryShape,
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "O período inicial deve ser anterior ao período final.",
  });

export class AuditController {
  constructor(private readonly queryAudit: QueryAuditUseCase) {}

  list = handle(200, (request) => this.queryAudit.execute(querySchema.parse(request.query)));
}
