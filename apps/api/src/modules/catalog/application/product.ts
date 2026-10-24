import { z } from "zod";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "DISCONTINUED", "ARCHIVED"] as const;
export const TRACKING_MODES = ["NONE", "LOT", "SERIAL"] as const;
export const BARCODE_TYPES = ["EAN_13", "EAN_8", "UPC_A", "GTIN_14", "CODE_128", "QR_CODE", "INTERNAL"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type TrackingMode = (typeof TRACKING_MODES)[number];
export type BarcodeType = (typeof BARCODE_TYPES)[number];

const nonNegative = z.number().finite().min(0);
const optionalNonNegative = nonNegative.nullable();
const optionalPositive = z.number().finite().positive().nullable();
const optionalDays = z.number().int().min(0).max(36_500).nullable();

const barcodeSchema = z.object({
  code: z.string().trim().min(1).max(64),
  type: z.enum(BARCODE_TYPES).default("EAN_13"),
  quantity: z.number().finite().positive().default(1),
  isPrimary: z.boolean().default(false),
});

const productFields = {
  name: z.string().trim().min(2, "Informe o nome do produto").max(200),
  description: z.string().trim().max(2000).nullable(),
  baseUnitId: z.string().uuid(),
  status: z.enum(PRODUCT_STATUSES),
  trackingMode: z.enum(TRACKING_MODES),
  minStock: nonNegative,
  maxStock: optionalNonNegative,
  reorderPoint: optionalNonNegative,
  safetyStock: optionalNonNegative,
  leadTimeDays: optionalDays,
  shelfLifeDays: optionalDays,
  weightKg: optionalPositive,
  lengthCm: optionalPositive,
  widthCm: optionalPositive,
  heightCm: optionalPositive,
  // NCM: 8 dígitos; aceita a máscara 0000.00.00.
  ncm: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, "O NCM deve ter 8 dígitos")
    .nullable(),
  standardCost: optionalNonNegative,
  salePrice: optionalNonNegative,
  brand: z.string().trim().min(1).max(120).nullable(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  categoryId: z.string().uuid().nullable(),
  barcodes: z.array(barcodeSchema).max(20),
  images: z.array(z.string().trim().url().refine((url) => url.startsWith("https://"), "Use uma URL HTTPS")).max(8),
};

const barcodesValid = (barcodes?: z.infer<typeof barcodeSchema>[]) =>
  !barcodes ||
  (barcodes.filter((barcode) => barcode.isPrimary).length <= 1 &&
    new Set(barcodes.map((barcode) => barcode.code)).size === barcodes.length);

const stockRangeValid = (value: { minStock?: number; maxStock?: number | null }) =>
  value.maxStock == null || value.minStock == null || value.maxStock >= value.minStock;

export const createProductSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9._-]{1,63}$/, "SKU inválido: use letras, números, ponto, hífen ou sublinhado (2 a 64)")),
    ...productFields,
  })
  .partial({
    description: true, status: true, trackingMode: true, minStock: true, maxStock: true, reorderPoint: true,
    safetyStock: true, leadTimeDays: true, shelfLifeDays: true, weightKg: true, lengthCm: true, widthCm: true,
    heightCm: true, ncm: true, standardCost: true, salePrice: true, brand: true, currency: true, categoryId: true, barcodes: true, images: true,
  })
  .refine((value) => barcodesValid(value.barcodes), { path: ["barcodes"], message: "Códigos de barras repetidos ou mais de um principal" })
  .refine(stockRangeValid, { path: ["maxStock"], message: "O estoque máximo deve ser maior ou igual ao mínimo" });

// O SKU é imutável: referenciado por saldos, movimentos e transações.
export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((value) => barcodesValid(value.barcodes), { path: ["barcodes"], message: "Códigos de barras repetidos ou mais de um principal" })
  .refine(stockRangeValid, { path: ["maxStock"], message: "O estoque máximo deve ser maior ou igual ao mínimo" });

export const listProductsSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsSchema>;

export type ProductBarcode = { id: string; code: string; type: BarcodeType; quantity: number; isPrimary: boolean };

export type ProductDetail = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  baseUnitId: string | null;
  status: ProductStatus;
  isActive: boolean;
  trackingMode: TrackingMode;
  minStock: number;
  maxStock: number | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  leadTimeDays: number | null;
  shelfLifeDays: number | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  ncm: string | null;
  standardCost: number | null;
  salePrice: number | null;
  brand: string | null;
  currency: string;
  categoryId: string | null;
  categoryName: string | null;
  barcodes: ProductBarcode[];
  images?: string[];
  stockSummary?: { quantity: number; reserved: number; available: number; incoming: number; warehouses: number };
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductListItem = Pick<
  ProductDetail,
  "id" | "sku" | "name" | "unit" | "status" | "isActive" | "trackingMode" | "minStock" | "standardCost" | "salePrice" | "brand" | "currency" | "categoryId" | "categoryName" | "updatedAt"
> & { totalQuantity: number };

export type UnitOption = { id: string; code: string; name: string; type: string; precision: number };
export type CategoryOption = { id: string; code: string; name: string; path: string; depth: number };

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export interface ProductRepository {
  list(query: ListProductsQuery): Promise<Page<ProductListItem>>;
  findById(id: string): Promise<ProductDetail | null>;
  /** Lança AppError 409 para SKU ou código de barras já existentes. */
  create(input: CreateProductInput & { unit: string; actorId: string }): Promise<ProductDetail>;
  update(id: string, input: UpdateProductInput & { unit?: string; actorId: string }): Promise<ProductDetail>;
  findUnit(id: string): Promise<UnitOption | null>;
  categoryExists(id: string): Promise<boolean>;
  lookups(): Promise<{ units: UnitOption[]; categories: CategoryOption[] }>;
}
