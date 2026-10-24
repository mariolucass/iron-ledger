import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { outboxEventPages } from "@/views/platform/outbox-events";

const page = outboxEventPages.list;

export const metadata = createMetadata({ ...page, path: "/system/outbox" });

export default function Page() {
  return <PlatformPage section="outbox" />;
}
