import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { warehouseInventoryPages } from "@/views/warehouse-inventory";

const page = warehouseInventoryPages.overview;

export const metadata = createMetadata({ ...page, path: "/warehouses/inventory" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
