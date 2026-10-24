import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { accountSecurityPages } from "@/views/account-security";

const page = accountSecurityPages.sessions;

export const metadata = createMetadata({ ...page, path: "/settings/sessions" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
