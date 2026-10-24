import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type {
  FeatureFlag,
  FeatureFlagInput,
  IdempotencyRow,
  InboxRow,
  OutboxDetail,
  OutboxRow,
  PlatformOverview,
  PlatformServices,
  SystemSetting,
} from "../model/types";
const base = "/api/platform";
const list = <T>(section: string, page: number) =>
  requestJson<PaginatedResponse<T>>(withQuery(`${base}/${section}`, { page, pageSize: 20 }));
export const platformApi = {
  overview: () => requestJson<PlatformOverview>(base),
  services: () => requestJson<PlatformServices>(`${base}/services`),
  outbox: (page = 1) => list<OutboxRow>("outbox", page),
  outboxDetail: (id: string) =>
    requestJson<OutboxDetail>(`${base}/outbox/${encodeURIComponent(id)}`),
  inbox: (page = 1) => list<InboxRow>("inbox", page),
  idempotencyKeys: (page = 1) => list<IdempotencyRow>("idempotency-keys", page),
  settings: (page = 1) => list<SystemSetting>("settings", page),
  flags: (page = 1) => list<FeatureFlag>("feature-flags", page),
  flag: (id: string) => requestJson<FeatureFlag>(`${base}/feature-flags/${encodeURIComponent(id)}`),
  createFlag: (input: FeatureFlagInput) =>
    requestJson<FeatureFlag>(`${base}/feature-flags`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateFlag: (id: string, input: FeatureFlagInput) =>
    requestJson<FeatureFlag>(`${base}/feature-flags/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
