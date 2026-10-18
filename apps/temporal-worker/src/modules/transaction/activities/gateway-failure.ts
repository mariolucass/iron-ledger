import { ApplicationFailure } from "@temporalio/activity";
import { GatewayError } from "../../../ports/gateway-error";

/** Traduz a classificação do gateway para a política de retry do Temporal. */
export async function runGatewayOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof GatewayError) {
      throw ApplicationFailure.create({
        message: error.message,
        type: error.code,
        nonRetryable: !error.retryable,
        details: [error.details],
      });
    }
    throw error;
  }
}
