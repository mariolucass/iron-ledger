import { z } from "zod";
import { pageQueryShape } from "../../../shared/utils/pagination";

export const UNIT_TYPES = ["UNIT", "WEIGHT", "VOLUME", "LENGTH", "AREA", "TIME"] as const;
export const createUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe o código")
    .max(32)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Código inválido")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, "Informe o nome").max(200),
  type: z.enum(UNIT_TYPES),
  precision: z.number().int().min(0).max(6).default(0),
  isActive: z.boolean().default(true),
});
export const listUnitsSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  ...pageQueryShape,
});
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type ListUnitsQuery = z.infer<typeof listUnitsSchema>;
export type UnitItem = CreateUnitInput & { id: string; createdAt: string; updatedAt: string };
export interface UnitRepository {
  list(
    query: ListUnitsQuery,
  ): Promise<{ items: UnitItem[]; total: number; page: number; pageSize: number }>;
  create(input: CreateUnitInput): Promise<UnitItem>;
}
