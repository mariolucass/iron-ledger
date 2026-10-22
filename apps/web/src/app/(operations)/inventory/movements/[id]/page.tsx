import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { stockMovementPages } from "@/views/stock-movements";

const page = stockMovementPages.detail;

export const metadata = createMetadata({ ...page });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
