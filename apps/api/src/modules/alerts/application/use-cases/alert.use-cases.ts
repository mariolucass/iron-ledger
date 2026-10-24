import type { AlertRepository, AlertStatusInput } from "../../domain/repositories/alert.repository";

export class ListAlertsUseCase {
  constructor(private readonly alerts: AlertRepository) {}

  execute() {
    return this.alerts.list();
  }
}

/** OPEN → ACKNOWLEDGED → RESOLVED; repetir o estado atual é inofensivo. */
export class UpdateAlertStatusUseCase {
  constructor(private readonly alerts: AlertRepository) {}

  execute(id: string, status: AlertStatusInput, actorId: string) {
    return this.alerts.updateStatus(id, status, actorId);
  }
}

export class ResolveAllAlertsUseCase {
  constructor(private readonly alerts: AlertRepository) {}

  async execute(actorId: string) {
    return { updatedCount: await this.alerts.resolveAll(actorId) };
  }
}
