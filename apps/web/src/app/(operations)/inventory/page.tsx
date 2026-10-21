import { createMetadata } from "@/shared/config/metadata";
import { InventoryPage } from "@/views/inventory";

export const metadata = createMetadata({
  title: "Estoque",
  description: "Controle de inventário multi-armazém em tempo real com orquestração automática.",
  path: "/inventory",
});

export default function Page() {
  return <InventoryPage />;
}
