import { describe, expect, it } from "vitest";
import { generateTransactionCode, Transaction } from "./transaction.entity";

const stock = { productId: "p-1", warehouseId: "w-1", sku: "SKU-1" };
const start = () => Transaction.start({ code: "TXN-1", stock, quantity: 2, initiatedBy: "user-1", correlationId: "corr-1" });

describe("Transaction", () => {
  it("nasce PENDING com item, histórico e evento TransactionStarted", () => {
    const transaction = start();
    const snapshot = transaction.snapshot();
    expect(snapshot.status).toBe("PENDING");
    expect(snapshot.workflowId).toBe(snapshot.id);
    expect(snapshot.items).toHaveLength(1);
    expect(transaction.pendingChanges()).toEqual([expect.objectContaining({ fromStatus: null, toStatus: "PENDING" })]);
    const [event] = transaction.pendingEvents();
    expect(event).toMatchObject({
      eventName: "Transaction.TransactionStarted",
      aggregateType: "Transaction",
      aggregateId: snapshot.id,
      correlationId: "corr-1",
      producer: "api",
      payload: { entityType: "Transaction", entityId: snapshot.id, action: "CREATE", status: "PENDING" },
    });
  });

  it("rejeita quantidade não positiva", () => {
    expect(() => Transaction.start({ code: "TXN-1", stock, quantity: 0, initiatedBy: "user-1" })).toThrow(/positiva/);
  });

  it("markProcessing é idempotente e aceita o runId depois", () => {
    const transaction = start();
    expect(transaction.markProcessing(null)).toBe(true);
    expect(transaction.markProcessing(null)).toBe(false);
    expect(transaction.markProcessing("run-1")).toBe(true);
    expect(transaction.snapshot().workflowRunId).toBe("run-1");
    expect(transaction.pendingChanges().map((change) => change.toStatus)).toEqual(["PENDING", "PROCESSING"]);
  });

  it("conclui com reserva e movimento e emite TransactionCompleted", () => {
    const transaction = start();
    transaction.markProcessing("run-1");
    transaction.committed(1);
    expect(transaction.applyOutcome({ status: "COMPLETED", reservationId: "r-1", movementId: "m-1" }, "worker")).toBe(true);
    const snapshot = transaction.snapshot();
    expect(snapshot.status).toBe("COMPLETED");
    expect(snapshot.completedAt).toBeInstanceOf(Date);
    expect(snapshot.items[0]).toMatchObject({ status: "CONFIRMED", reservationId: "r-1", movementId: "m-1" });
    expect(transaction.pendingEvents()[0]?.eventName).toBe("Transaction.TransactionCompleted");
  });

  it("passa por COMPENSATING antes de COMPENSATED", () => {
    const transaction = start();
    transaction.markProcessing("run-1");
    expect(transaction.recordReservation("r-1")).toBe(true);
    expect(transaction.beginCompensation()).toBe(true);
    transaction.applyOutcome({ status: "COMPENSATED", reservationId: "r-1", reason: "falhou" }, "worker");
    expect(transaction.pendingChanges().map((change) => change.toStatus)).toEqual(["PENDING", "PROCESSING", "COMPENSATING", "COMPENSATED"]);
    expect(transaction.snapshot().items[0]?.status).toBe("RELEASED");
    expect(transaction.snapshot().failureReason).toBe("falhou");
  });

  it("repetir o mesmo desfecho é inofensivo; desfecho divergente é conflito", () => {
    const transaction = start();
    transaction.markProcessing("run-1");
    transaction.applyOutcome({ status: "FAILED", reason: "x" }, "worker");
    transaction.committed(2);
    expect(transaction.applyOutcome({ status: "FAILED", reason: "x" }, "worker")).toBe(false);
    expect(transaction.pendingEvents()).toHaveLength(0);
    expect(() => transaction.applyOutcome({ status: "COMPLETED", reservationId: "r", movementId: "m" }, "worker"))
      .toThrow(expect.objectContaining({ code: "TRANSACTION_ALREADY_FINALIZED", statusCode: 409 }));
  });

  it("não permite concluir antes de a Saga iniciar", () => {
    const transaction = start();
    expect(() => transaction.applyOutcome({ status: "COMPLETED", reservationId: "r", movementId: "m" }, "worker"))
      .toThrow(expect.objectContaining({ code: "INVALID_TRANSACTION_TRANSITION" }));
  });

  it("gera códigos legíveis e datados", () => {
    expect(generateTransactionCode(new Date("2026-10-18T10:00:00Z"))).toMatch(/^TXN-20261018-[0-9A-F]{6}$/);
  });
});
