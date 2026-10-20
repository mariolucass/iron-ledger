import type { ReservationSnapshot } from "@iron-ledger/workflow-contracts";
import type { InventoryGateway, ReserveStockInput } from "../../ports/inventory-gateway";
import { ApiClient } from "./api-client";
import { ApiError } from "./api-error";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object")
    throw new ApiError("Resposta de estoque inválida.", 502, "INVALID_API_RESPONSE");
  return value as Record<string, unknown>;
}

function identified(value: unknown): { id: string } {
  const body = record(value);
  if (typeof body.id !== "string" || !body.id)
    throw new ApiError("Resposta sem identificador.", 502, "INVALID_API_RESPONSE");
  return { id: body.id };
}

export class InventoryApiGateway implements InventoryGateway {
  constructor(private readonly client: ApiClient) {}

  async reserve(input: ReserveStockInput, correlationId?: string) {
    return identified(
      await this.client.request("POST", "/inventory/reservations", input, correlationId),
    );
  }

  async commit(reservationId: string, correlationId?: string) {
    return identified(
      await this.client.request(
        "POST",
        `/inventory/reservations/${encodeURIComponent(reservationId)}/commit`,
        {},
        correlationId,
      ),
    );
  }

  async release(reservationId: string, correlationId?: string) {
    identified(
      await this.client.request(
        "POST",
        `/inventory/reservations/${encodeURIComponent(reservationId)}/release`,
        {},
        correlationId,
      ),
    );
  }

  async findByTransaction(
    transactionId: string,
    correlationId?: string,
  ): Promise<ReservationSnapshot> {
    const body = record(
      await this.client.request(
        "GET",
        `/inventory/reservations/by-transaction/${encodeURIComponent(transactionId)}`,
        undefined,
        correlationId,
      ),
    );
    if (body.status === "NOT_FOUND") return { status: "NOT_FOUND" };
    if (typeof body.reservationId === "string") {
      if (body.status === "COMMITTED" && typeof body.movementId === "string") {
        return {
          status: "COMMITTED",
          reservationId: body.reservationId,
          movementId: body.movementId,
        };
      }
      if (body.status === "ACTIVE" || body.status === "RELEASED" || body.status === "EXPIRED") {
        return { status: body.status, reservationId: body.reservationId };
      }
    }
    throw new ApiError("Estado de reserva inválido.", 502, "INVALID_API_RESPONSE");
  }
}
