import { createMetadata } from "@/shared/config/metadata";
import { SettingsPage } from "@/views/platform/settings";

export const metadata = createMetadata({
  title: "Configurações",
  description: "Gerenciamento de preferências, integrações e permissões do workspace.",
  path: "/settings",
});

export default function Page() {
  return <SettingsPage />;
}
