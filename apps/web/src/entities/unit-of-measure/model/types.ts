export const UNIT_TYPES = ["UNIT", "WEIGHT", "VOLUME", "LENGTH", "AREA", "TIME"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];
export const unitTypeLabels: Record<UnitType, string> = {
  UNIT: "Quantidade",
  WEIGHT: "Peso",
  VOLUME: "Volume",
  LENGTH: "Comprimento",
  AREA: "Área",
  TIME: "Tempo",
};
export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  type: UnitType;
  precision: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export type CreateUnitInput = Pick<
  UnitOfMeasure,
  "code" | "name" | "type" | "precision" | "isActive"
>;
export interface UnitQuery {
  q?: string;
  page?: number;
  pageSize?: number;
}
