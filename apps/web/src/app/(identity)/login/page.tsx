import { createMetadata } from "@/shared/config/metadata";
import { LoginPage } from "@/views/identity/login";

export const metadata = createMetadata({
  title: "Entrar",
  description: "Acesse o seu workspace do Iron Ledger com segurança de nível corporativo.",
  path: "/login",
});

export default function Page() {
  return <LoginPage />;
}
