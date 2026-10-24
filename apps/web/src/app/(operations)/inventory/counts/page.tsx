import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { stockCountPages } from "@/views/stock-counts";

const page = stockCountPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/counts" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
