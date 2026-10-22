import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { inboxMessagePages } from "@/views/inbox-messages";

const page = inboxMessagePages.list;

export const metadata = createMetadata({ ...page, path: "/system/inbox" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
