import type { AuditLog, NewAuditLog } from "../entities/audit-log.entity";

export type AuditQuery = {
  eventName?: string;
  entityType?: string;
  entityId?: string;
  actor?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

export interface AuditRepository {
  createIfAbsent(entry: NewAuditLog): Promise<AuditLog>;
  query(input: AuditQuery): Promise<{ items: AuditLog[]; page: number; pageSize: number; total: number }>;
}
