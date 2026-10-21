import { createMetadata } from "@/shared/config/metadata";
import { WarehouseEditorPage } from "@/views/warehouse-editor";

export const metadata = createMetadata({
  title: "Armazém",
  description: "Detalhes, edição e localizações da instalação.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WarehouseEditorPage warehouseId={id} />;
}
