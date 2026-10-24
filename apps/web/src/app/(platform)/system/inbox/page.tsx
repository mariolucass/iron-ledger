import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { inboxMessagePages } from "@/views/platform/inbox-messages";

const page = inboxMessagePages.list;

export const metadata = createMetadata({ ...page, path: "/system/inbox" });

export default function Page() {
  return <PlatformPage section="inbox" />;
}
