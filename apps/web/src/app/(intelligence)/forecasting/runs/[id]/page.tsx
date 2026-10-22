import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { forecastRunPages } from "@/views/forecast-runs";

const page = forecastRunPages.detail;

export const metadata = createMetadata({ ...page });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
