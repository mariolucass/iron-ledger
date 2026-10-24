import { createMetadata } from "@/shared/config/metadata";
import { DashboardPage } from "@/views/intelligence/dashboard";

export const metadata = createMetadata({
  title: "Dashboard",
  description:
    "Visão geral e inteligência operacional em tempo real do seu ecossistema financeiro.",
  path: "/dashboard",
});

export default function Page() {
  return <DashboardPage />;
}
