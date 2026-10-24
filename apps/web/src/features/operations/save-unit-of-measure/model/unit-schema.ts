import { z } from "zod";
import { UNIT_TYPES, type CreateUnitInput } from "@/entities/unit-of-measure";
export const unitFormSchema = z.object({
  code: z.string().trim().min(1, "Informe o código.").max(32).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Use letras, números, ponto, hífen ou sublinhado."),
  name: z.string().trim().min(2, "Informe o nome.").max(200),
  type: z.enum(UNIT_TYPES),
  precision: z.string().regex(/^[0-6]$/, "Informe de 0 a 6 casas decimais."),
  isActive: z.boolean(),
});
export type UnitFormValues = z.infer<typeof unitFormSchema>;
export const emptyUnitForm: UnitFormValues = { code: "", name: "", type: "UNIT", precision: "0", isActive: true };
export const toUnitInput = (values: UnitFormValues): CreateUnitInput => ({
  code: values.code.trim().toUpperCase(), name: values.name.trim(), type: values.type,
  precision: Number(values.precision), isActive: values.isActive,
});
