import type { PlannedPage } from "@/shared/config/planned-page";

/** Unidades de medida do catálogo (catalog.UnitOfMeasure). */
export const unitOfMeasurePages = {
  list: {
    title: "Unidades de medida",
    description: "Unidades de quantidade, peso, volume, comprimento, área e tempo com sua precisão.",
    back: { href: "/products", label: "Produtos" },
    action: { href: "/products/units-of-measure/new", label: "Nova unidade" },
  },
  create: {
    title: "Nova unidade de medida",
    description: "Defina código, nome, tipo e casas decimais da unidade.",
    back: { href: "/products/units-of-measure", label: "Unidades de medida" },
  },
  detail: {
    title: "Unidade de medida",
    description: "Cadastro da unidade e produtos que a utilizam.",
    back: { href: "/products/units-of-measure", label: "Unidades de medida" },
  },
} satisfies Record<string, PlannedPage>;
