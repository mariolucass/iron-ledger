import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { stockTransferPages } from "@/views/operations/stock-transfers";

const page = stockTransferPages.create;

export const metadata = createMetadata({ ...page, path: "/inventory/transfers/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
