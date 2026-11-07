import { requestJson } from "@/shared/api/client";
import type { AlertItem, AlertListResponse, AlertStatusUpdate } from "../model/types";

export const alertApi = {
  list: () => requestJson<AlertListResponse>("/api/alerts"),
  updateStatus: (id: string, status: AlertStatusUpdate) =>
    requestJson<AlertItem>(`/api/alerts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  resolveAll: () =>
    requestJson<{ updatedCount: number }>("/api/alerts/resolve-all", { method: "POST" }),
};
