export type AlertStatusInput = "ACKNOWLEDGED" | "RESOLVED";

export type AlertRecord = {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  occurrences: number;
  triggeredAt: Date;
  lastSeenAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
};

export type AlertList = {
  items: AlertRecord[];
  total: number;
  counts: { open: number; acknowledged: number; resolved: number; critical: number };
};

export interface AlertRepository {
  list(): Promise<AlertList>;
  updateStatus(id: string, status: AlertStatusInput, actorId: string): Promise<AlertRecord>;
  resolveAll(actorId: string): Promise<number>;
}
