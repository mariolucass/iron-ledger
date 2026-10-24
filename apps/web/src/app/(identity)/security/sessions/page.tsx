import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { securityPages } from "@/views/security";

const page = securityPages.sessions;

export const metadata = createMetadata({ ...page, path: "/security/sessions" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
