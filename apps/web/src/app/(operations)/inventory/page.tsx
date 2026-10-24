import { createMetadata } from "@/shared/config/metadata";
import { InventoryPage } from "@/views/operations/inventory";
import { inventoryServerApi } from "@/entities/inventory/server";
import { warehouseServerApi } from "@/entities/warehouse/server";
import { presentInventoryPage, PAGE_SIZE } from "@/views/operations/inventory/server";

export const metadata = createMetadata({
  title: "Estoque",
  description: "Controle de inventário multi-armazém em tempo real com orquestração automática.",
  path: "/inventory",
});

export default async function Page() {
  const [inventory, warehouses] = await Promise.all([
    inventoryServerApi.list({ page: 1, pageSize: PAGE_SIZE }),
    warehouseServerApi.list(),
  ]);
  return (
    <InventoryPage
      initial={presentInventoryPage(inventory)}
      initialWarehouses={warehouses.items.map(({ id, name }) => ({ value: id, label: name }))}
    />
  );
}
