import { createMetadata } from "@/shared/config/metadata";
import { RoleEditorPage, rolePages } from "@/views/identity/roles";

const page = rolePages.create;

export const metadata = createMetadata({ ...page, path: "/users/roles/new" });

export default function Page() {
  return <RoleEditorPage />;
}
