import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { stockMovementPages } from "@/views/operations/stock-movements";

const page = stockMovementPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/movements" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
