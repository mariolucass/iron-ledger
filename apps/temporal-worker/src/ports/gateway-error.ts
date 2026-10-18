/** Failure classification at the gateway boundary, independent of Temporal. */
export class GatewayError extends Error {
  constructor(message: string, readonly code: string, readonly retryable: boolean, readonly details?: object) {
    super(message);
    this.name = "GatewayError";
  }
}
