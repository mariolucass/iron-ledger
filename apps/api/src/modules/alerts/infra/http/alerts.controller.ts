import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import type {
  ListAlertsUseCase,
  ResolveAllAlertsUseCase,
  UpdateAlertStatusUseCase,
} from "../../application/use-cases/alert.use-cases";
import type { AlertRecord } from "../../domain/repositories/alert.repository";

const idSchema = z.string().uuid();
const statusSchema = z.object({ status: z.enum(["ACKNOWLEDGED", "RESOLVED"]) });

function toAlertDto(alert: AlertRecord) {
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
  constructor(
    private readonly listAlerts: ListAlertsUseCase,
    private readonly updateAlertStatus: UpdateAlertStatusUseCase,
    private readonly resolveAllAlerts: ResolveAllAlertsUseCase,
  ) {}

  list = handle(200, async () => {
    const result = await this.listAlerts.execute();
    return { ...result, items: result.items.map(toAlertDto) };
  });

  update = handle(200, async (request) => {
    const id = idSchema.parse(request.params.id);
    const { status } = statusSchema.parse(request.body);
    return toAlertDto(await this.updateAlertStatus.execute(id, status, request.auth!.userId));
  });

  resolveAll = handle(200, (request) => this.resolveAllAlerts.execute(request.auth!.userId));
}
