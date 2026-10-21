import { createMetadata } from "@/shared/config/metadata";
import { ReportsPage } from "@/views/reports";

export const metadata = createMetadata({
  title: "Relatórios",
  description: "Extração e relatórios de atividades, auditoria e controle de estoques.",
  path: "/reports",
});

export default function Page() {
  return <ReportsPage />;
}
