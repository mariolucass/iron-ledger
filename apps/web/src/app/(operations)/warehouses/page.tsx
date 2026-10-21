import { createMetadata } from "@/shared/config/metadata";
import { WarehousesPage } from "@/views/warehouses";

export const metadata = createMetadata({
  title: "Armazéns",
  description: "Controle e monitoramento de instalações, armazéns e zonas de armazenamento.",
  path: "/warehouses",
});

export default function Page() {
  return <WarehousesPage />;
}
