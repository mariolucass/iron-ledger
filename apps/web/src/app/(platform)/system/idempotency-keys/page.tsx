import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { idempotencyKeyPages } from "@/views/platform/idempotency-keys";

const page = idempotencyKeyPages.list;

export const metadata = createMetadata({ ...page, path: "/system/idempotency-keys" });

export default function Page() {
  return <PlatformPage section="idempotency" />;
}
