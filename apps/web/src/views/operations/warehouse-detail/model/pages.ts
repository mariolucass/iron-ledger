import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Páginas de um armazém (warehouse.Warehouse, WarehouseLocation e relações). */
export const warehouseDetailPages = {
  overview: (id: string): PlannedPage => ({
    title: "Armazém",
    description: "Apresentação da instalação, estoque e operações relacionadas.",
    back: { href: "/warehouses", label: "Armazéns" },
    action: { href: `/warehouses/${id}/edit` as Route, label: "Editar armazém" },
  }),
  inventory: (id: string): PlannedPage => ({
    title: "Estoque do armazém",
    description: "Saldos, reservas e itens críticos deste armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  locations: (id: string): PlannedPage => ({
    title: "Localizações do armazém",
    description: "Estrutura e ocupação das localizações deste armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  location: (id: string): PlannedPage => ({
    title: "Localização",
    description: "Capacidade, regras de separação e recebimento e saldos desta localização.",
    back: { href: `/warehouses/${id}/locations` as Route, label: "Localizações" },
  }),
  movements: (id: string): PlannedPage => ({
    title: "Movimentações do armazém",
    description: "Entradas, saídas e ajustes realizados neste armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  reservations: (id: string): PlannedPage => ({
    title: "Reservas do armazém",
    description: "Reservas ativas e históricas sobre o estoque deste armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  transfers: (id: string): PlannedPage => ({
    title: "Transferências do armazém",
    description: "Transferências de entrada e saída deste armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  counts: (id: string): PlannedPage => ({
    title: "Contagens do armazém",
    description: "Contagens de estoque registradas neste armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  access: (id: string): PlannedPage => ({
    title: "Acessos ao armazém",
    description: "Usuários com acesso a este armazém e seus níveis de permissão.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  settings: (id: string): PlannedPage => ({
    title: "Parâmetros do armazém",
    description: "Configurações que valem somente para este armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
  auditLog: (id: string): PlannedPage => ({
    title: "Auditoria do armazém",
    description: "Eventos de auditoria associados a este armazém.",
    back: { href: `/warehouses/${id}` as Route, label: "Armazém" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
