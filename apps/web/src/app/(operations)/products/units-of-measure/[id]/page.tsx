import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { unitOfMeasurePages } from "@/views/units-of-measure";

const page = unitOfMeasurePages.detail;

export const metadata = createMetadata({ ...page });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
