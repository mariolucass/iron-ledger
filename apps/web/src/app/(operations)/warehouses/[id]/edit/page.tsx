import { createMetadata } from "@/shared/config/metadata";
import { WarehouseEditorPage } from "@/views/operations/warehouse-editor";

export const metadata = createMetadata({
  title: "Editar armazém",
  description: "Atualize os dados e as localizações do armazém.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WarehouseEditorPage warehouseId={id} />;
}
