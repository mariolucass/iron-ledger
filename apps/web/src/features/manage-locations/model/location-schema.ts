import { z } from "zod";
import { LOCATION_TYPES, type WarehouseLocation } from "@/entities/warehouse";

const parseNumber = (value: string) => Number(value.trim().replace(",", "."));

const positive = (message: string, integer = false) =>
  z.string().trim().refine((value) => {
    if (value === "") return true;
    const number = parseNumber(value);
    return Number.isFinite(number) && (integer ? Number.isInteger(number) && number >= 0 : number > 0);
  }, message);

export const locationFormSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/, "Use até 32 caracteres: letras, números, ponto, hífen ou sublinhado."),
  type: z.enum(LOCATION_TYPES),
  parentId: z.string(),
  name: z.string().trim().max(120, "Nome muito longo."),
  isPickable: z.boolean(),
  isReceivable: z.boolean(),
  maxWeightKg: positive("Informe um valor maior que zero."),
  maxVolumeM3: positive("Informe um valor maior que zero."),
  pickSequence: positive("Informe um número inteiro maior ou igual a zero.", true),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const emptyLocationForm = (parentId = ""): LocationFormValues => ({
  code: "", type: parentId ? "AISLE" : "ZONE", parentId, name: "", isPickable: true, isReceivable: true,
  maxWeightKg: "", maxVolumeM3: "", pickSequence: "",
});

export const toLocationFormValues = (location: WarehouseLocation): LocationFormValues => ({
  code: location.code,
  type: location.type,
  parentId: location.parentId ?? "",
  name: location.name ?? "",
  isPickable: location.isPickable,
  isReceivable: location.isReceivable,
  maxWeightKg: location.maxWeightKg === null ? "" : String(location.maxWeightKg),
  maxVolumeM3: location.maxVolumeM3 === null ? "" : String(location.maxVolumeM3),
  pickSequence: location.pickSequence === null ? "" : String(location.pickSequence),
});

const optional = (value: string) => (value.trim() === "" ? null : parseNumber(value));

export const toLocationFlags = (values: LocationFormValues) => ({
  name: values.name.trim() || null,
  isPickable: values.isPickable,
  isReceivable: values.isReceivable,
  maxWeightKg: optional(values.maxWeightKg),
  maxVolumeM3: optional(values.maxVolumeM3),
  pickSequence: optional(values.pickSequence),
});
