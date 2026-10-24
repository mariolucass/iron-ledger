import { unitServerApi } from "@/entities/unit-of-measure/server";
import { createMetadata } from "@/shared/config/metadata";
import { UnitsPage } from "@/views/operations/units-of-measure";
export const metadata = createMetadata({ title: "Unidades de medida", description: "Unidades do catálogo", path: "/products/units-of-measure" });
export default async function Page() {
  const initial = await unitServerApi.list({ page: 1, pageSize: 20 });
  return <UnitsPage initial={initial} />;
}
