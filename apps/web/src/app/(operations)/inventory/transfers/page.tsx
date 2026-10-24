import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { stockTransferPages } from "@/views/stock-transfers";

const page = stockTransferPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/transfers" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
