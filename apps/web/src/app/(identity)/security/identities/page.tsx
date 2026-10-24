import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { securityPages } from "@/views/security";

const page = securityPages.identities;

export const metadata = createMetadata({ ...page, path: "/security/identities" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
