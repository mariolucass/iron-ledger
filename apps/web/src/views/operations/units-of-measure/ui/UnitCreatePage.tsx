"use client";
import { useRouter } from "next/navigation";
import { UnitForm } from "@/features/operations/save-unit-of-measure";
import { FormPage } from "@/shared/ui/form-page";
import { Layout } from "@/widgets/layout";
export function UnitCreatePage() {
  const router = useRouter();
  return <Layout title="Nova unidade de medida"><FormPage back={{ href: "/products/units-of-measure", label: "Unidades de medida" }} title="Nova unidade de medida" description="Defina código, nome, tipo e precisão da unidade.">
    <UnitForm onCancel={() => router.push("/products/units-of-measure")} onSaved={() => router.push("/products/units-of-measure")} />
  </FormPage></Layout>;
}
