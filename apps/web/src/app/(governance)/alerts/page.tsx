import { createMetadata } from "@/shared/config/metadata";
import { AlertsPage } from "@/views/alerts";

export const metadata = createMetadata({
  title: "Alertas",
  description: "Central de monitoramento de anomalias e eventos críticos do sistema.",
  path: "/alerts",
});

export default function Page() {
  return <AlertsPage />;
}
