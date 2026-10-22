import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { securityPages } from "@/views/security";

const page = securityPages.lockouts;

export const metadata = createMetadata({ ...page, path: "/security/lockouts" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
