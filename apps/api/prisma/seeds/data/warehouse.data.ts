export const warehouses = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    code: "WH-CENTRO",
    name: "Loja Centro",
    address: "São Paulo, SP",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    code: "WH-SUL",
    name: "Estoque Sul",
    address: "Curitiba, PR",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    code: "WH-NORTE",
    name: "Estoque Norte",
    address: "Manaus, AM",
  },
] as const;

export type WarehouseCode = (typeof warehouses)[number]["code"];
