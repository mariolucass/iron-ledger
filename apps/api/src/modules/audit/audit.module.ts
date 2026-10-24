import type { ModuleFactory } from "../../infra/http/module";
import { QueryAuditUseCase } from "./application/use-cases/query-audit.use-case";
import { AuditController } from "./infra/http/audit.controller";
import { createAuditRouter } from "./infra/http/audit.routes";
import { PrismaAuditRepository } from "./infra/repositories/prisma-audit.repository";

export const auditModule: ModuleFactory = ({ env }) => [
  {
    path: "/audit",
    router: createAuditRouter(
      new AuditController(new QueryAuditUseCase(new PrismaAuditRepository())),
      env.JWT_SECRET,
    ),
  },
];
