import { createMetadata } from "@/shared/config/metadata";
import { UserEditorPage } from "@/views/user-editor";

export const metadata = createMetadata({
  title: "Usuário",
  description: "Dados, situação e papéis do usuário.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserEditorPage userId={id} />;
}
