import { createMetadata } from "@/shared/config/metadata";
import { UserInvitationsPage, userInvitationPages } from "@/views/identity/user-invitations";

const page = userInvitationPages.list;

export const metadata = createMetadata({ ...page, path: "/users/invitations" });

export default function Page() {
  return <UserInvitationsPage />;
}
