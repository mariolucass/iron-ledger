import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { securityPages } from "@/views/identity/security";

const page = securityPages.overview;

export const metadata = createMetadata({ ...page, path: "/security" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
