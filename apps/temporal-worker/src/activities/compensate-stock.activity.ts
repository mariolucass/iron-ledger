import { apiRequest } from "./api-client";

export async function compensateStock(reservationId: string): Promise<void> {
  await apiRequest(`/inventory/reservations/${reservationId}/release`, {});
}
