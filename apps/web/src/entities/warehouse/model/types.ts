import type { PaginatedResponse } from "@/shared/api/client";

export const WAREHOUSE_TYPES = ["DISTRIBUTION_CENTER", "STORE", "FULFILLMENT_CENTER", "CROSS_DOCK", "THIRD_PARTY", "VIRTUAL"] as const;
export const LOCATION_TYPES = ["ZONE", "AISLE", "RACK", "SHELF", "BIN", "DOCK", "STAGING", "QUARANTINE"] as const;

export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];
export type LocationType = (typeof LOCATION_TYPES)[number];

/** Public warehouse summary returned by GET /warehouses. */
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface WarehousesResponse {
  items: Warehouse[];
}

export interface WarehouseStockSummary {
  skuCount: number;
  totalQuantity: number;
  reserved: number;
}

export interface WarehouseSummary extends Warehouse, WarehouseStockSummary {
  type: WarehouseType;
  city: string | null;
  state: string | null;
  locationCount: number;
}

export interface WarehouseLocation {
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
}

export interface WarehouseDetail extends Warehouse, WarehouseStockSummary {
  type: WarehouseType;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  taxId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  locations: WarehouseLocation[];
}

export interface WarehouseQuery {
  q?: string;
  status?: "active" | "inactive" | "all";
  type?: WarehouseType;
  page?: number;
  pageSize?: number;
}

export type WarehousesPage = PaginatedResponse<WarehouseSummary>;

/** Writable warehouse fields; every optional field accepts `null` to clear it. */
export interface WarehouseInput {
  name: string;
  type: WarehouseType;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  taxId: string | null;
  isActive: boolean;
}

export type CreateWarehouseInput = WarehouseInput & { code: string };

export interface LocationFlags {
  name: string | null;
  isPickable: boolean;
  isReceivable: boolean;
  isActive: boolean;
  maxWeightKg: number | null;
  maxVolumeM3: number | null;
  pickSequence: number | null;
}

export type CreateLocationInput = Partial<LocationFlags> & {
  code: string;
  type: LocationType;
  parentId?: string | null;
};
export type UpdateLocationInput = Partial<LocationFlags>;
