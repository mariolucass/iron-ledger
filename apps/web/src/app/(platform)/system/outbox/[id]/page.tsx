import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { outboxEventPages } from "@/views/outbox-events";

const page = outboxEventPages.detail;

export const metadata = createMetadata({ ...page });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
