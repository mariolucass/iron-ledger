import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { stockReservationPages } from "@/views/operations/stock-reservations";

const page = stockReservationPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/reservations" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
