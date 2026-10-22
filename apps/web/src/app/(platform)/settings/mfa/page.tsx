import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { accountSecurityPages } from "@/views/account-security";

const page = accountSecurityPages.mfa;

export const metadata = createMetadata({ ...page, path: "/settings/mfa" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
