import { createMetadata } from "@/shared/config/metadata";
import { PlatformPage } from "@/views/platform/platform-data";
import { systemSettingPages } from "@/views/platform/system-settings";

const page = systemSettingPages.list;

export const metadata = createMetadata({ ...page, path: "/system/settings" });

export default function Page() {
  return <PlatformPage section="settings" />;
}
