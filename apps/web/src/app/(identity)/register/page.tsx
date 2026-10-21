import { createMetadata } from "@/shared/config/metadata";
import { RegisterPage } from "@/views/register";

export const metadata = createMetadata({
  title: "Criar conta",
  description: "Crie sua conta e acesse o workspace do Iron Ledger.",
  path: "/register",
});

export default function Page() {
  return <RegisterPage />;
}
