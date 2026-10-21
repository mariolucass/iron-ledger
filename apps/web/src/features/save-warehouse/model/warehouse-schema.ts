import { z } from "zod";
import { WAREHOUSE_TYPES, type WarehouseDetail, type WarehouseInput } from "@/entities/warehouse";

const parseNumber = (value: string) => Number(value.trim().replace(",", "."));
const coordinate = (limit: number, message: string) =>
  z.string().trim().refine((value) => {
    if (value === "") return true;
    const number = parseNumber(value);
    return Number.isFinite(number) && Math.abs(number) <= limit;
  }, message);

export const warehouseFormSchema = z
  .object({
    code: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/, "Use até 32 caracteres: letras, números, ponto, hífen ou sublinhado."),
    name: z.string().trim().min(2, "Informe o nome da instalação.").max(200, "Nome muito longo."),
    type: z.enum(WAREHOUSE_TYPES),
    addressLine: z.string().trim().max(200, "Endereço muito longo."),
    city: z.string().trim().max(100, "Cidade muito longa."),
    state: z.string().trim().max(50, "Estado muito longo."),
    postalCode: z.string().trim().max(20, "CEP muito longo."),
    countryCode: z.string().trim().length(2, "Use o código de 2 letras (ex.: BR)."),
    latitude: coordinate(90, "Latitude entre -90 e 90."),
    longitude: coordinate(180, "Longitude entre -180 e 180."),
    timezone: z.string().trim().min(1, "Informe o fuso horário."),
    taxId: z.string().trim().refine((value) => value === "" || value.replace(/\D/g, "").length === 14, "O CNPJ deve ter 14 dígitos."),
    isActive: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if ((values.latitude === "") !== (values.longitude === "")) {
      ctx.addIssue({ code: "custom", path: [values.latitude === "" ? "latitude" : "longitude"], message: "Informe latitude e longitude juntas." });
    }
  });

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export const emptyWarehouseForm: WarehouseFormValues = {
  code: "", name: "", type: "DISTRIBUTION_CENTER", addressLine: "", city: "", state: "", postalCode: "",
  countryCode: "BR", latitude: "", longitude: "", timezone: "America/Sao_Paulo", taxId: "", isActive: true,
};

export function toFormValues(warehouse: WarehouseDetail): WarehouseFormValues {
  return {
    code: warehouse.code,
    name: warehouse.name,
    type: warehouse.type,
    addressLine: warehouse.addressLine ?? "",
    city: warehouse.city ?? "",
    state: warehouse.state ?? "",
    postalCode: warehouse.postalCode ?? "",
    countryCode: warehouse.countryCode,
    latitude: warehouse.latitude === null ? "" : String(warehouse.latitude),
    longitude: warehouse.longitude === null ? "" : String(warehouse.longitude),
    timezone: warehouse.timezone,
    taxId: warehouse.taxId ?? "",
    isActive: warehouse.isActive,
  };
}

const orNull = (value: string) => value.trim() || null;

export function toWarehouseInput(values: WarehouseFormValues): WarehouseInput {
  return {
    name: values.name.trim(),
    type: values.type,
    addressLine: orNull(values.addressLine),
    city: orNull(values.city),
    state: orNull(values.state),
    postalCode: orNull(values.postalCode),
    countryCode: values.countryCode.trim().toUpperCase(),
    latitude: values.latitude.trim() === "" ? null : parseNumber(values.latitude),
    longitude: values.longitude.trim() === "" ? null : parseNumber(values.longitude),
    timezone: values.timezone.trim(),
    taxId: orNull(values.taxId),
    isActive: values.isActive,
  };
}
