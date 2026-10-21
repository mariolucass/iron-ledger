import type { LocationType, WarehouseType } from "../model/types";

export const warehouseTypeLabel: Record<WarehouseType, string> = {
  DISTRIBUTION_CENTER: "Centro de distribuição",
  STORE: "Loja",
  FULFILLMENT_CENTER: "Centro de fulfillment",
  CROSS_DOCK: "Cross-dock",
  THIRD_PARTY: "Terceirizado (3PL)",
  VIRTUAL: "Virtual",
};

export const locationTypeLabel: Record<LocationType, string> = {
  ZONE: "Zona",
  AISLE: "Corredor",
  RACK: "Estante",
  SHELF: "Prateleira",
  BIN: "Compartimento",
  DOCK: "Doca",
  STAGING: "Área de preparação",
  QUARANTINE: "Quarentena",
};
