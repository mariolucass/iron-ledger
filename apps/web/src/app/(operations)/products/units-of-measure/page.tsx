import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { unitOfMeasurePages } from "@/views/units-of-measure";

const page = unitOfMeasurePages.list;

export const metadata = createMetadata({ ...page, path: "/products/units-of-measure" });

export default function Page() {
  return <ComingSoonPage {...page} />;
}
