import type { Metadata } from "next";
import { AuditLogPage } from "@/views/audit-log";

export const metadata: Metadata = {
  title: "Log de Auditoria - Iron Ledger",
  description: "Trilha de auditoria criptografica e imutavel para total conformidade regulatoria.",
};

export default function Page() {
  return <AuditLogPage />;
}
