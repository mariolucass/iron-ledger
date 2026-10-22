import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { outboxEventPages } from "@/views/outbox-events";

const page = outboxEventPages.list;

export const metadata = createMetadata({ ...page, path: "/system/outbox" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
