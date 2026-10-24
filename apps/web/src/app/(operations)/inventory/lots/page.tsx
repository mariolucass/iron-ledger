import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { inventoryLotPages } from "@/views/operations/inventory-lots";

const page = inventoryLotPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/lots" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
