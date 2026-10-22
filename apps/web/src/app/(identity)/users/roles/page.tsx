import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { rolePages } from "@/views/roles";

const page = rolePages.list;

export const metadata = createMetadata({ ...page, path: "/users/roles" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
