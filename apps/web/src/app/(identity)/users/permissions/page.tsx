import { createMetadata } from "@/shared/config/metadata";
import { PermissionsPage, permissionPages } from "@/views/identity/permissions";

const page = permissionPages.list;

export const metadata = createMetadata({ ...page, path: "/users/permissions" });

export default function Page() {
  return <PermissionsPage />;
}
