import type { Metadata } from "next";
import { AuditLogPage } from "@/features/(governance)/audit-log/ui/AuditLogPage";

export const metadata: Metadata = {
  title: "Log de Auditoria - Iron Ledger",
  description: "Trilha de auditoria criptografica e imutavel para total conformidade regulatoria.",
};

export default function Page() {
  return <AuditLogPage />;
}