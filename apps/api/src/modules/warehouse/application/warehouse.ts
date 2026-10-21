import { z } from "zod";

export const WAREHOUSE_TYPES = ["DISTRIBUTION_CENTER", "STORE", "FULFILLMENT_CENTER", "CROSS_DOCK", "THIRD_PARTY", "VIRTUAL"] as const;
export const LOCATION_TYPES = ["ZONE", "AISLE", "RACK", "SHELF", "BIN", "DOCK", "STAGING", "QUARANTINE"] as const;

export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];
export type LocationType = (typeof LOCATION_TYPES)[number];

const code = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9._-]{0,31}$/, "Código inválido: use até 32 letras, números, ponto, hífen ou sublinhado"));

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null).nullable();

const timezone = z
  .string()
  .trim()
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Fuso horário inválido");

const warehouseFields = {
  name: z.string().trim().min(2, "Informe o nome da instalação").max(200),
  type: z.enum(WAREHOUSE_TYPES),
  addressLine: optionalText(200),
  city: optionalText(100),
  state: optionalText(50),
  postalCode: optionalText(20),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  timezone,
  // CNPJ: 14 dígitos; aceita a máscara 00.000.000/0000-00.
  taxId: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value === "" || value.length === 14, "O CNPJ deve ter 14 dígitos")
    .transform((value) => value || null)
    .nullable(),
  isActive: z.boolean(),
};

const coordinatesValid = (value: { latitude?: number | null; longitude?: number | null }) =>
  (value.latitude == null) === (value.longitude == null) || value.latitude === undefined || value.longitude === undefined;

export const createWarehouseSchema = z
  .object({ code, ...warehouseFields })
  .partial({
    type: true, addressLine: true, city: true, state: true, postalCode: true, countryCode: true,
    latitude: true, longitude: true, timezone: true, taxId: true, isActive: true,
  })
  .refine(coordinatesValid, { path: ["longitude"], message: "Informe latitude e longitude juntas" });

// O código é imutável: aparece em saldos, movimentos e relatórios.
export const updateWarehouseSchema = z
  .object(warehouseFields)
  .partial()
  .refine(coordinatesValid, { path: ["longitude"], message: "Informe latitude e longitude juntas" });

export const listWarehousesSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  // Padrão `active` mantém o contrato antigo de GET /warehouses (usado nos filtros de estoque).
  status: z.enum(["active", "inactive", "all"]).default("active"),
  type: z.enum(WAREHOUSE_TYPES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(100),
});

const locationFields = {
  name: optionalText(120),
  isPickable: z.boolean(),
  isReceivable: z.boolean(),
  isActive: z.boolean(),
  maxWeightKg: z.number().finite().positive().nullable(),
  maxVolumeM3: z.number().finite().positive().nullable(),
  pickSequence: z.number().int().min(0).max(1_000_000).nullable(),
};

export const createLocationSchema = z
  .object({ code, type: z.enum(LOCATION_TYPES), parentId: z.string().uuid().nullable(), ...locationFields })
  .partial({
    parentId: true, name: true, isPickable: true, isReceivable: true, isActive: true,
    maxWeightKg: true, maxVolumeM3: true, pickSequence: true,
  });

// Código, tipo e pai definem o caminho materializado e não mudam depois de criados.
export const updateLocationSchema = z.object(locationFields).partial();

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type ListWarehousesQuery = z.infer<typeof listWarehousesSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

export type WarehouseStockSummary = {
  skuCount: number;
  totalQuantity: number;
  reserved: number;
};

export type WarehouseListItem = {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  address: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  locationCount: number;
} & WarehouseStockSummary;

export type LocationNode = {
  id: string;
  parentId: string | null;
  code: string;
  name: string | null;
  type: LocationType;
  path: string;
  isPickable: boolean;
  isReceivable: boolean;
  isActive: boolean;
  maxWeightKg: number | null;
  maxVolumeM3: number | null;
  pickSequence: number | null;
};

export type WarehouseDetail = Omit<WarehouseListItem, "locationCount"> & {
  addressLine: string | null;
  postalCode: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  taxId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  locations: LocationNode[];
};

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export interface WarehouseRepository {
  list(query: ListWarehousesQuery): Promise<Page<WarehouseListItem>>;
  findById(id: string): Promise<WarehouseDetail | null>;
  /** Lança AppError 409 quando o código já existe. */
  create(input: CreateWarehouseInput): Promise<WarehouseDetail>;
  update(id: string, input: UpdateWarehouseInput): Promise<WarehouseDetail>;
  stockOnHand(id: string): Promise<number>;

  findLocation(warehouseId: string, locationId: string): Promise<LocationNode | null>;
  /** Lança AppError 409 quando o código já existe no armazém. */
  createLocation(warehouseId: string, input: CreateLocationInput & { path: string }): Promise<LocationNode>;
  updateLocation(locationId: string, input: UpdateLocationInput): Promise<LocationNode>;
  locationStockOnHand(locationId: string): Promise<number>;
  activeChildCount(locationId: string): Promise<number>;
}
