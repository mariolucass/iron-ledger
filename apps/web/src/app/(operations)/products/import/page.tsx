import { createMetadata } from "@/shared/config/metadata";
import { ProductImportPage } from "@/views/operations/product-import";
import { productServerApi } from "@/entities/product/server";

export const metadata = createMetadata({
  title: "Importar produtos",
  description: "Importe produtos em lote a partir de CSV ou Excel.",
  path: "/products/import",
});

export default async function Page() {
  const lookups = await productServerApi.lookups();
  return <ProductImportPage units={lookups.units} />;
}
