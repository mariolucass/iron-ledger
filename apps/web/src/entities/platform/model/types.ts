export interface PlatformOverview {
  outbox: Record<string, number>;
  inbox: Record<string, number>;
  featureFlags: number;
  visibleSettings: number;
  idempotencyKeys: number;
}
export type ServiceHealth = "up" | "degraded" | "down" | "disabled";
export interface ServiceStatus {
  key: string;
  name: string;
  role: string;
  optional: boolean;
  status: ServiceHealth;
  latencyMs: number | null;
  error: string | null;
  details: { label: string; value: string }[];
}
export interface PlatformServices {
  checkedAt: string;
  services: ServiceStatus[];
}
export interface OutboxRow {
  id: string;
  sequence: string;
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  status: string;
  attempts: number;
  lastError: string | null;
  occurredAt: string;
  publishedAt: string | null;
}
export interface OutboxDetail extends OutboxRow {
  eventVersion: number;
  exchange: string;
  routingKey: string;
  payload: unknown;
  headers: unknown;
  correlationId: string | null;
  causationId: string | null;
  availableAt: string;
  lockedUntil: string | null;
}
export interface InboxRow {
  id: string;
  messageId: string;
  consumer: string;
  eventName: string;
  status: string;
  attempts: number;
  lastError: string | null;
  receivedAt: string;
  processedAt: string | null;
}
export interface IdempotencyRow {
  id: string;
  key: string;
  scope: string;
  status: string;
  responseStatus: number | null;
  createdAt: string;
  expiresAt: string;
}
export interface SystemSetting {
  id: string;
  scope: string;
  scopeId: string | null;
  key: string;
  value: unknown;
  description: string | null;
  version: number;
  updatedAt: string;
}
export interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  isEnabled: boolean;
  rollout: number;
  rules: unknown | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface FeatureFlagInput {
  key: string;
  description: string | null;
  isEnabled: boolean;
  rollout: number;
  rules: unknown | null;
}
