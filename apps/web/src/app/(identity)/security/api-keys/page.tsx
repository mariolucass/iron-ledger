import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { apiKeyPages } from "@/views/api-keys";

const page = apiKeyPages.list;

export const metadata = createMetadata({ ...page, path: "/security/api-keys" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
