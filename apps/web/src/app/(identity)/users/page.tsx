import { createMetadata } from "@/shared/config/metadata";
import { UsersPage } from "@/views/users";

export const metadata = createMetadata({
  title: "Usuários",
  description: "Controle de acesso, papéis e gerenciamento de usuários do workspace.",
  path: "/users",
});

export default function Page() {
  return <UsersPage />;
}
