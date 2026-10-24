import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { locationStockPages } from "@/views/operations/location-stock";

const page = locationStockPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/locations" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
