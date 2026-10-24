import { createMetadata } from "@/shared/config/metadata";
import { FeatureFlagEditorPage } from "@/views/platform/platform-data";
export const metadata = createMetadata({
  title: "Editar feature flag",
  description: "Edite a configuração da feature flag.",
});
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeatureFlagEditorPage id={id} />;
}
