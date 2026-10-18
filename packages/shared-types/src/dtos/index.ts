export * from "./transaction";

import type {
  AnalyticsEntityType,
  AnalyticsSource,
  InflectionSeverity,
} from "../events";

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string | number;
  user: AuthenticatedUserDto;
}

export type InventoryStatus = "CRITICAL" | "LOW" | "OK";

export interface WarehouseSummaryDto {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface InventoryItemDto {
  stockLevelId: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  status: InventoryStatus;
  updatedAt: string;
}

export interface InventoryListDto {
  items: InventoryItemDto[];
  page: number;
  pageSize: number;
  total: number;
}

export type StockMovementType =
  | "INBOUND"
  | "OUTBOUND"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RESERVATION"
  | "RELEASE"
  | "RETURN";

export interface CreateStockMovementDto {
  stockLevelId: string;
  type: StockMovementType;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}

export interface StockMovementDto extends CreateStockMovementDto {
  id: string;
  productId: string;
  sku: string;
  warehouseId: string;
  previousQuantity: number;
  resultingQuantity: number;
  performedBy: string;
  createdAt: string;
}

export interface CreateStockReservationDto {
  stockLevelId: string;
  quantity: number;
  transactionId?: string;
  expiresAt?: string;
}

export interface ReleaseStockReservationDto {
  reservationId: string;
}

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "PERMISSION_CHANGE";

export interface AuditEntryDto {
  id: string;
  eventId: string;
  eventName: string;
  occurredAt: string;
  actorId: string | null;
  actorEmail: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  correlationId: string | null;
  payload: Record<string, unknown>;
}

export interface AuditListDto {
  items: AuditEntryDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AnalyticsSummaryDto {
  observations: number;
  inflectionPoints: number;
  sellers: number;
  categories: number;
  firstDetection: string | null;
  lastDetection: string | null;
  bySeverity: Partial<Record<InflectionSeverity, number>>;
  method: "median_mad_persistent_window";
}

export interface InflectionPointDto {
  id: string;
  detectedAt: string;
  entityType: AnalyticsEntityType;
  entityId: string;
  metric: string;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  changePercentage: number | null;
  robustScore: number;
  confidence: number;
  severity: InflectionSeverity;
  explanation: string;
  source: AnalyticsSource;
  evidence: {
    method: string;
    baselineWeeks: number;
    currentWeeks: number;
    baselineValues: number[];
    currentValues: number[];
    baselineOrders: number;
    currentOrders: number;
    confidenceMeaning: string;
    limitation: string;
  };
}

export interface InflectionPointListDto {
  items: InflectionPointDto[];
  count: number;
  limit: number;
  offset: number;
}
