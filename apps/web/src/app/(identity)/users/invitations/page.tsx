import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { userInvitationPages } from "@/views/user-invitations";

const page = userInvitationPages.list;

export const metadata = createMetadata({ ...page, path: "/users/invitations" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
