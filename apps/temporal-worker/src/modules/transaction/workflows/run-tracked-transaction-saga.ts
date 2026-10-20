import type {
  RecordSagaStepInput,
  SagaStepKind,
  SagaStepName,
  TransactionOutcome,
  TransactionSagaInput,
  TransactionSagaResult,
} from "@iron-ledger/workflow-contracts";
import type { TransactionActivities } from "../contracts/transaction-activities";
import type { TransactionLifecycleActivities } from "../contracts/transaction-lifecycle-activities";
import { describeFailure } from "./describe-failure";
import { runTransactionSaga, type RecoveryRuntime } from "./run-transaction-saga";

export interface TrackingRuntime extends RecoveryRuntime {
  /** Relógio determinístico do workflow, em ISO-8601. */
  now(): string;
}

type StepOutput = RecordSagaStepInput["output"];

/**
 * Executa a mesma Saga de `runTransactionSaga`, espelhando cada passo e o
 * desfecho no contexto `transaction` da API.
 *
 * - O registro de passos é best-effort: falhar ao registrar nunca altera o
 *   resultado de negócio da Saga.
 * - O desfecho é obrigatório: se não puder ser reportado, o workflow falha e
 *   fica visível para reconciliação operacional.
 * - Tudo roda em escopo não cancelável para que o cancelamento não perca o rastro.
 */
export async function runTrackedTransactionSaga(
  input: TransactionSagaInput,
  activities: TransactionActivities,
  lifecycle: TransactionLifecycleActivities,
  runtime: TrackingRuntime,
): Promise<TransactionSagaResult> {
  let sequence = 0;
  const { transactionId } = input;

  const record = (step: Omit<RecordSagaStepInput, "transactionId">) =>
    runtime
      .nonCancellable(() => lifecycle.recordSagaStep({ transactionId, ...step }))
      .catch(() => undefined);

  function track<A extends unknown[], R>(
    name: SagaStepName,
    kind: SagaStepKind,
    run: (...args: A) => Promise<R>,
    output?: (result: R) => StepOutput,
  ): (...args: A) => Promise<R> {
    return async (...args: A) => {
      const step = { sequence: ++sequence, name, kind, startedAt: runtime.now() };
      await record({ ...step, status: "RUNNING" });
      try {
        const result = await run(...args);
        await record({
          ...step,
          status: "SUCCEEDED",
          finishedAt: runtime.now(),
          output: output?.(result),
        });
        return result;
      } catch (error) {
        await record({
          ...step,
          status: "FAILED",
          finishedAt: runtime.now(),
          error: describeFailure(error).message,
        });
        throw error;
      }
    };
  }

  const tracked: TransactionActivities = {
    reserveStock: track("reserveStock", "ACTION", activities.reserveStock, (reservation) => ({
      reservationId: reservation.id,
    })),
    confirmTransaction: track(
      "confirmTransaction",
      "ACTION",
      activities.confirmTransaction,
      (movement) => ({ movementId: movement.id }),
    ),
    reconcileReservation: track(
      "reconcileReservation",
      "ACTION",
      activities.reconcileReservation,
      (snapshot) => ({
        reservationStatus: snapshot.status,
        reservationId: "reservationId" in snapshot ? snapshot.reservationId : null,
      }),
    ),
    compensateStock: track("compensateStock", "COMPENSATION", activities.compensateStock),
  };

  const report = (outcome: TransactionOutcome) =>
    runtime.nonCancellable(() => lifecycle.reportTransactionOutcome({ transactionId, outcome }));

  let result: TransactionSagaResult;
  try {
    result = await runTransactionSaga(input, tracked, runtime);
  } catch (error) {
    const failure = describeFailure(error);
    const outcome: TransactionOutcome = runtime.isCancellation(error)
      ? { status: "CANCELLED", reason: "Workflow cancelado; reservas ativas foram liberadas." }
      : { status: "FAILED", reason: failure.message, failureCode: failure.type };
    // O erro original é o que importa para o operador; não o mascara com a falha do report.
    await report(outcome).catch(() => undefined);
    throw error;
  }
  await report(result);
  return result;
}
