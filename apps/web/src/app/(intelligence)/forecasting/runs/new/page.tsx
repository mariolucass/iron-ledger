import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { forecastRunPages } from "@/views/forecast-runs";

const page = forecastRunPages.create;

export const metadata = createMetadata({ ...page, path: "/forecasting/runs/new" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
