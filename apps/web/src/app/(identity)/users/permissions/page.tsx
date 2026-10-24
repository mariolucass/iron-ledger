import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { permissionPages } from "@/views/permissions";

const page = permissionPages.list;

export const metadata = createMetadata({ ...page, path: "/users/permissions" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
