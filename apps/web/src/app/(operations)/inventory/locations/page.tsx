import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { locationStockPages } from "@/views/location-stock";

const page = locationStockPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/locations" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
