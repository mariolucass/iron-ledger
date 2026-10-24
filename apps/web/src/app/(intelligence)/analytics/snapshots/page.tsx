import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { inventorySnapshotPages } from "@/views/inventory-snapshots";

const page = inventorySnapshotPages.list;

export const metadata = createMetadata({ ...page, path: "/analytics/snapshots" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
