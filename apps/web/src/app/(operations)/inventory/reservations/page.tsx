import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { stockReservationPages } from "@/views/stock-reservations";

const page = stockReservationPages.list;

export const metadata = createMetadata({ ...page, path: "/inventory/reservations" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
