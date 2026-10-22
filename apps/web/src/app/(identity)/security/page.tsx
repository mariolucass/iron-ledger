import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { securityPages } from "@/views/security";

const page = securityPages.overview;

export const metadata = createMetadata({ ...page, path: "/security" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
