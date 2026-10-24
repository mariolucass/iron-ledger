import { z } from "zod";
import {
  BARCODE_TYPES,
  PRODUCT_STATUSES,
  TRACKING_MODES,
  type Product,
  type ProductInput,
} from "@/entities/product";

/** Campos numéricos chegam como texto do input; aceitam vírgula decimal. */
const parseNumber = (value: string) => Number(value.trim().replace(",", "."));

const numeric = (message: string, { min = 0, integer = false, positive = false } = {}) =>
  z.string().trim().refine((value) => {
    if (value === "") return true;
    const number = parseNumber(value);
    if (!Number.isFinite(number)) return false;
    if (integer && !Number.isInteger(number)) return false;
    return positive ? number > 0 : number >= min;
  }, message);

export const productFormSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/, "Use 2 a 64 caracteres: letras, números, ponto, hífen ou sublinhado."),
    name: z.string().trim().min(2, "Informe o nome do produto.").max(200, "Nome muito longo."),
    description: z.string().trim().max(2000, "Descrição muito longa."),
    baseUnitId: z.string().min(1, "Selecione a unidade de medida."),
    categoryId: z.string(),
    status: z.enum(PRODUCT_STATUSES),
    trackingMode: z.enum(TRACKING_MODES),
    minStock: numeric("Informe um número maior ou igual a zero.").refine((v) => v !== "", "Informe o estoque mínimo."),
    maxStock: numeric("Informe um número maior ou igual a zero."),
    reorderPoint: numeric("Informe um número maior ou igual a zero."),
    safetyStock: numeric("Informe um número maior ou igual a zero."),
    leadTimeDays: numeric("Informe um número inteiro de dias.", { integer: true }),
    shelfLifeDays: numeric("Informe um número inteiro de dias.", { integer: true }),
    weightKg: numeric("Informe um valor maior que zero.", { positive: true }),
    lengthCm: numeric("Informe um valor maior que zero.", { positive: true }),
    widthCm: numeric("Informe um valor maior que zero.", { positive: true }),
    heightCm: numeric("Informe um valor maior que zero.", { positive: true }),
    ncm: z
      .string()
      .trim()
      .refine((value) => value === "" || value.replace(/\D/g, "").length === 8, "O NCM deve ter 8 dígitos."),
    standardCost: numeric("Informe um valor maior ou igual a zero."),
    currency: z.string().trim().length(3, "Use o código de 3 letras (ex.: BRL)."),
    barcodes: z.array(
      z.object({
        code: z.string().trim().min(1, "Informe o código.").max(64, "Código muito longo."),
        type: z.enum(BARCODE_TYPES),
        quantity: numeric("Informe um valor maior que zero.", { positive: true }).refine((v) => v !== "", "Informe a quantidade."),
        isPrimary: z.boolean(),
      }),
    ),
    images: z.array(z.object({ url: z.string().trim().url("Informe uma URL válida.").refine((url) => url.startsWith("https://"), "Use uma URL HTTPS.") })).max(8, "Use até 8 fotos."),
  })
  .superRefine((values, ctx) => {
    if (values.maxStock !== "" && values.minStock !== "" && parseNumber(values.maxStock) < parseNumber(values.minStock)) {
      ctx.addIssue({ code: "custom", path: ["maxStock"], message: "O máximo deve ser maior ou igual ao mínimo." });
    }
    const codes = new Set<string>();
    values.barcodes.forEach((barcode, index) => {
      const code = barcode.code.trim();
      if (code && codes.has(code)) {
        ctx.addIssue({ code: "custom", path: ["barcodes", index, "code"], message: "Código repetido." });
      }
      codes.add(code);
    });
    if (values.barcodes.filter((barcode) => barcode.isPrimary).length > 1) {
      ctx.addIssue({ code: "custom", path: ["barcodes"], message: "Apenas um código pode ser o principal." });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const emptyProductForm: ProductFormValues = {
  sku: "", name: "", description: "", baseUnitId: "", categoryId: "", status: "ACTIVE", trackingMode: "NONE",
  minStock: "0", maxStock: "", reorderPoint: "", safetyStock: "", leadTimeDays: "", shelfLifeDays: "",
  weightKg: "", lengthCm: "", widthCm: "", heightCm: "", ncm: "", standardCost: "", currency: "BRL", barcodes: [], images: [],
};

const text = (value: number | null) => (value === null ? "" : String(value));

export function toFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    baseUnitId: product.baseUnitId ?? "",
    categoryId: product.categoryId ?? "",
    status: product.status,
    trackingMode: product.trackingMode,
    minStock: String(product.minStock),
    maxStock: text(product.maxStock),
    reorderPoint: text(product.reorderPoint),
    safetyStock: text(product.safetyStock),
    leadTimeDays: text(product.leadTimeDays),
    shelfLifeDays: text(product.shelfLifeDays),
    weightKg: text(product.weightKg),
    lengthCm: text(product.lengthCm),
    widthCm: text(product.widthCm),
    heightCm: text(product.heightCm),
    ncm: product.ncm ?? "",
    standardCost: text(product.standardCost),
    currency: product.currency,
    barcodes: product.barcodes.map(({ code, type, quantity, isPrimary }) => ({ code, type, quantity: String(quantity), isPrimary })),
    images: (product.images ?? []).map((url) => ({ url })),
  };
}

const optional = (value: string) => (value.trim() === "" ? null : parseNumber(value));

export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    baseUnitId: values.baseUnitId,
    categoryId: values.categoryId || null,
    status: values.status,
    trackingMode: values.trackingMode,
    minStock: parseNumber(values.minStock),
    maxStock: optional(values.maxStock),
    reorderPoint: optional(values.reorderPoint),
    safetyStock: optional(values.safetyStock),
    leadTimeDays: optional(values.leadTimeDays),
    shelfLifeDays: optional(values.shelfLifeDays),
    weightKg: optional(values.weightKg),
    lengthCm: optional(values.lengthCm),
    widthCm: optional(values.widthCm),
    heightCm: optional(values.heightCm),
    ncm: values.ncm.trim() || null,
    standardCost: optional(values.standardCost),
    currency: values.currency.trim().toUpperCase(),
    barcodes: values.barcodes.map(({ code, type, quantity, isPrimary }) => ({
      code: code.trim(), type, quantity: parseNumber(quantity), isPrimary,
    })),
    images: values.images.map(({ url }) => url.trim()),
  };
}
