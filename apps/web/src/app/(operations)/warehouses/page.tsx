import { createMetadata } from "@/shared/config/metadata";
import { WarehousesPage } from "@/views/warehouses";
import { warehouseServerApi } from "@/entities/warehouse/server";

export const metadata = createMetadata({
  title: "Armazéns",
  description: "Controle e monitoramento de instalações, armazéns e zonas de armazenamento.",
  path: "/warehouses",
});

export default async function Page() {
  const initial = await warehouseServerApi.search({ status: "active", pageSize: 100 });
  return <WarehousesPage initial={initial} />;
}
