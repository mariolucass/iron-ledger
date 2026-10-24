import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { securityPages } from "@/views/identity/security";

const page = securityPages.lockouts;

export const metadata = createMetadata({ ...page, path: "/security/lockouts" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
