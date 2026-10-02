import { apiRequest } from "./api-client";

export async function reserveStock(input: { stockLevelId: string; quantity: number; transactionId: string }): Promise<{ id: string }> {
  return apiRequest("/inventory/reservations", input);
}
