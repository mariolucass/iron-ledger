export const units = [
  { code: "un", name: "Unidade", type: "UNIT", precision: 0 },
  { code: "cx", name: "Caixa", type: "UNIT", precision: 0 },
  { code: "kg", name: "Quilograma", type: "WEIGHT", precision: 3 },
] as const;

export const categories = [
  { code: "CALCADOS", name: "Calçados", slug: "calcados" },
  { code: "VESTUARIO", name: "Vestuário", slug: "vestuario" },
] as const;

export type CategoryCode = (typeof categories)[number]["code"];

export const products = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    sku: "SKU-4821-A",
    name: "Tênis Esportivo Nike Air",
    minStock: 5,
    maxStock: 100,
    category: "CALCADOS",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    sku: "SKU-3910-B",
    name: "Camiseta de Algodão Premium",
    minStock: 15,
    maxStock: 300,
    category: "VESTUARIO",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    sku: "SKU-2201-C",
    name: "Jaqueta de Couro Sintético",
    minStock: 8,
    maxStock: 100,
    category: "VESTUARIO",
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    sku: "SKU-1092-D",
    name: "Calça Jeans Slim Fit",
    minStock: 15,
    maxStock: 200,
    category: "VESTUARIO",
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    sku: "SKU-7832-F",
    name: "Moletom com Capuz",
    minStock: 20,
    maxStock: 300,
    category: "VESTUARIO",
  },
] as const satisfies readonly { category: CategoryCode; [key: string]: unknown }[];

export type ProductSku = (typeof products)[number]["sku"];
