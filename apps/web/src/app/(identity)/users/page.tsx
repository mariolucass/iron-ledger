import type { Metadata } from "next";
import { UsersPage } from "@/views/users";

export const metadata: Metadata = {
  title: "Usuarios - Iron Ledger",
  description: "Controle de acesso, permissoes e gerenciamento de usuarios.",
};

export default function Page() {
  return <UsersPage />;
}
