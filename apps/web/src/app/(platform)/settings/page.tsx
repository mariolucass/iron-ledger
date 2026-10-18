import type { Metadata } from "next";
import { SettingsPage } from "@/views/settings";

export const metadata: Metadata = {
  title: "Configuracoes - Iron Ledger",
  description:
    "Gerenciamento de preferencias, integracoes e permissoes do workspace.",
};

export default function Page() {
  return <SettingsPage />;
}
