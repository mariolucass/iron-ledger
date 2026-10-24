import { createMetadata } from "@/shared/config/metadata";
import { AccountSecurityPage } from "@/views/platform/account-security";
import { accountSecurityPages } from "@/views/platform/account-security";

const page = accountSecurityPages.sessions;

export const metadata = createMetadata({ ...page, path: "/settings/sessions" });

export default function Page() {
  return <AccountSecurityPage section="sessions" />;
}
