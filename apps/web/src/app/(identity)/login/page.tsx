import type { Metadata } from "next";
import { LoginPage } from "@/views/login";

export const metadata: Metadata = {
  title: "Entrar - Iron Ledger",
  description:
    "Acesse o seu workspace do Iron Ledger com seguranca de nivel corporativo.",
};

export default function Page() {
  return <LoginPage />;
}
