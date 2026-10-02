import type { AuditQuery, AuditRepository } from "../../domain/repositories/audit.repository";

export class QueryAuditUseCase {
  constructor(private readonly audit: AuditRepository) {}

  execute(input: AuditQuery) {
    return this.audit.query(input);
  }
}
