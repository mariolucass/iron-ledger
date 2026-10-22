import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { inventoryLotPages } from "@/views/inventory-lots";

const page = inventoryLotPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/lots" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
