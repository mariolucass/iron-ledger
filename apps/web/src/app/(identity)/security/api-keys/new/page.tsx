import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { apiKeyPages } from "@/views/identity/api-keys";

const page = apiKeyPages.create;

export const metadata = createMetadata({ ...page, path: "/security/api-keys/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
