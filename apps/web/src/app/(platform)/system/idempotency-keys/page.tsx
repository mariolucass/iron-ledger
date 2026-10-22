import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { idempotencyKeyPages } from "@/views/idempotency-keys";

const page = idempotencyKeyPages.list;

export const metadata = createMetadata({ ...page, path: "/system/idempotency-keys" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
