import { z } from "zod";
import { pageQueryShape } from "../../../../shared/utils/pagination";

const statuses = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "COMPENSATING",
  "COMPENSATED",
  "FAILED",
  "CANCELLED",
] as const;
const types = ["SALE", "PURCHASE_RECEIPT", "TRANSFER", "RETURN", "ADJUSTMENT"] as const;

export const startTransactionSchema = z.object({
  stockLevelId: z.string().uuid(),
  quantity: z.number().positive().finite(),
  externalRef: z.string().trim().min(1).max(120).optional(),
  failConfirmation: z.boolean().default(false),
});

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(120)
  .regex(/^[A-Za-z0-9_\-:.]+$/)
  .optional();

export const listTransactionsSchema = z.object({
  status: z.enum(statuses).optional(),
  type: z.enum(types).optional(),
  code: z.string().trim().min(1).max(40).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  ...pageQueryShape,
});

export const transactionIdSchema = z.object({ id: z.string().uuid() });

const stepOutputValue = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);

/** Contrato `RecordSagaStepInput` (packages/workflow-contracts). */
export const recordStepSchema = z.object({
  sequence: z.number().int().positive().max(1_000),
  name: z.enum(["reserveStock", "confirmTransaction", "reconcileReservation", "compensateStock"]),
  kind: z.enum(["ACTION", "COMPENSATION"]),
  status: z.enum(["RUNNING", "SUCCEEDED", "FAILED"]),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().max(2_000).optional(),
  output: z.record(stepOutputValue).optional(),
});

/** Contrato `TransactionOutcome` (packages/workflow-contracts). */
export const outcomeSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("COMPLETED"),
    reservationId: z.string().uuid(),
    movementId: z.string().uuid(),
  }),
  z.object({
    status: z.literal("COMPENSATED"),
    reservationId: z.string().uuid(),
    reason: z.string().max(2_000),
  }),
  z.object({
    status: z.literal("FAILED"),
    reason: z.string().max(2_000),
    failureCode: z.string().max(120).optional(),
  }),
  z.object({ status: z.literal("CANCELLED"), reason: z.string().max(2_000) }),
]);
