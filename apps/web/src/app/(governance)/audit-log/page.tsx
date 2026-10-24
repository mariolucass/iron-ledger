import { createMetadata } from "@/shared/config/metadata";
import { AuditLogPage } from "@/views/governance/audit-log";

export const metadata = createMetadata({
  title: "Log de auditoria",
  description:
    "Trilha de auditoria imutável para conformidade regulatória e rastreabilidade de cada operação.",
  path: "/audit-log",
});

export default function Page() {
  return <AuditLogPage />;
}
