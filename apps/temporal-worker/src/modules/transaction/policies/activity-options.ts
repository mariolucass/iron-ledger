import { ActivityCancellationType, type ActivityOptions } from "@temporalio/workflow";

/** Keep legacy scheduling options unchanged for histories without the patch. */
export const legacyOptions = {
  startToCloseTimeout: "30 seconds",
  retry: { maximumAttempts: 3 },
} satisfies ActivityOptions;

export const operationOptions = {
  startToCloseTimeout: "60 seconds",
  scheduleToCloseTimeout: "5 minutes",
  cancellationType: ActivityCancellationType.WAIT_CANCELLATION_COMPLETED,
  retry: { initialInterval: "1 second", backoffCoefficient: 2, maximumAttempts: 3 },
} satisfies ActivityOptions;

/** Rastro de passos: curto e com poucas tentativas, nunca deve atrasar a Saga. */
export const stepTrackingOptions = {
  startToCloseTimeout: "15 seconds",
  scheduleToCloseTimeout: "1 minute",
  retry: { initialInterval: "500 milliseconds", backoffCoefficient: 2, maximumAttempts: 3 },
} satisfies ActivityOptions;

/** Desfecho: estado de negócio, insiste até a API voltar (com teto de 30 minutos). */
export const outcomeReportingOptions = {
  startToCloseTimeout: "30 seconds",
  scheduleToCloseTimeout: "30 minutes",
  retry: { initialInterval: "1 second", backoffCoefficient: 2, maximumInterval: "1 minute" },
} satisfies ActivityOptions;

export const recoveryOptions = {
  startToCloseTimeout: "60 seconds",
  scheduleToCloseTimeout: "15 minutes",
  cancellationType: ActivityCancellationType.WAIT_CANCELLATION_COMPLETED,
  retry: { initialInterval: "2 seconds", maximumInterval: "30 seconds", maximumAttempts: 10 },
} satisfies ActivityOptions;
