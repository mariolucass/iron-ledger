import { createMetadata } from "@/shared/config/metadata";
import { UnitCreatePage } from "@/views/operations/units-of-measure";
export const metadata = createMetadata({ title: "Nova unidade de medida", description: "Cadastro de unidade de medida", path: "/products/units-of-measure/new" });
export default function Page() { return <UnitCreatePage />; }
