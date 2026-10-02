import { ApplicationFailure } from "@temporalio/activity";
import { apiRequest } from "./api-client";

export async function confirmTransaction(input: { reservationId: string; failConfirmation: boolean }): Promise<{ id: string }> {
  if (input.failConfirmation) {
    throw ApplicationFailure.nonRetryable("Falha de confirmação solicitada para demonstrar compensação.");
  }
  return apiRequest(`/inventory/reservations/${input.reservationId}/commit`, {});
}
