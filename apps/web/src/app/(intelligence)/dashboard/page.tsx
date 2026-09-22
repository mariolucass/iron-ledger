import type { Metadata } from "next";
import { DashboardPage } from "@/features/(intelligence)/dashboard/ui/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard - Iron Ledger",
  description: "Visao geral e inteligencia operacional em tempo real do seu ecossistema financeiro.",
};

export default function Page() {
  return <DashboardPage />;
}