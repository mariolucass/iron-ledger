import { createMetadata } from "@/shared/config/metadata";
import { RolePage, rolePages } from "@/views/identity/roles";

const page = rolePages.list;

export const metadata = createMetadata({ ...page, path: "/users/roles" });

export default function Page() {
  return <RolePage section="list" />;
}
