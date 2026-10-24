"use client";

import type { UnitOption } from "@/entities/product";
import { ProductImport } from "@/features/operations/import-products";
import { FormPage } from "@/shared/ui/form-page";
import { Layout } from "@/widgets/layout";

export function ProductImportPage({ units }: { units: UnitOption[] }) {
  return (
    <Layout title="Importar produtos">
      <FormPage
        wide
        back={{ href: "/products", label: "Produtos" }}
        title="Importar produtos"
        description="Cadastre ou atualize produtos em lote a partir de uma planilha. Você confere a prévia antes de gravar."
      >
        <ProductImport units={units} />
      </FormPage>
    </Layout>
  );
}
