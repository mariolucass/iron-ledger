import type { Metadata } from "next";
import { SettingsPage } from "@/features/(platform)/settings/ui/SettingsPage";

export const metadata: Metadata = {
  title: "Configuracoes - Iron Ledger",
  description: "Gerenciamento de preferencias, integracoes e permissoes do workspace.",
};

export default function Page() {
  return <SettingsPage />;
}