import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { warehouseInventoryPages } from "@/views/operations/warehouse-inventory";

const page = warehouseInventoryPages.overview;

export const metadata = createMetadata({ ...page, path: "/warehouses/inventory" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
