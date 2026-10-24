import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/common/coming-soon";
import { forecastRunPages } from "@/views/intelligence/forecast-runs";

const page = forecastRunPages.list;

export const metadata = createMetadata({ ...page, path: "/forecasting/runs" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
