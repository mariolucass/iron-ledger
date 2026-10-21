import { createMetadata } from "@/shared/config/metadata";
import { WarehouseEditorPage } from "@/views/warehouse-editor";

export const metadata = createMetadata({
  title: "Nova instalação",
  description: "Registre um armazém, loja ou centro de distribuição.",
  path: "/warehouses/new",
});

export default function Page() {
  return <WarehouseEditorPage />;
}
