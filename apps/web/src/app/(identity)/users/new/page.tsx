import { createMetadata } from "@/shared/config/metadata";
import { UserEditorPage } from "@/views/identity/user-editor";

export const metadata = createMetadata({
  title: "Novo usuário",
  description: "Crie uma conta de acesso e defina seus papéis.",
  path: "/users/new",
});

export default function Page() {
  return <UserEditorPage />;
}
