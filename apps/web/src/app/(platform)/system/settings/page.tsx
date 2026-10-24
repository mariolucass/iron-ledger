import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { systemSettingPages } from "@/views/system-settings";

const page = systemSettingPages.list;

export const metadata = createMetadata({ ...page, path: "/system/settings" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
