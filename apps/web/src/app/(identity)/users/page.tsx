import { createMetadata } from "@/shared/config/metadata";
import { UsersPage } from "@/views/identity/users";
import { userServerApi } from "@/entities/user/server";

export const metadata = createMetadata({
  title: "Usuários",
  description: "Controle de acesso, papéis e gerenciamento de usuários do workspace.",
  path: "/users",
});

export default async function Page() {
  const [initial, roles] = await Promise.all([
    userServerApi.list({ page: 1, pageSize: 20 }),
    userServerApi.listRoles(),
  ]);
  return <UsersPage initial={initial} initialRoles={roles.items} />;
}
