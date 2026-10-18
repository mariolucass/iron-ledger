/**
 * Mensagem e tipo mais específicos da cadeia de causas. Falhas de activity chegam
 * embrulhadas (`ActivityFailure: Activity task failed` → `ApplicationFailure`).
 * Função pura: segura dentro do sandbox de workflow.
 */
export function describeFailure(error: unknown): { message: string; type?: string } {
  let current: unknown = error;
  let message = error instanceof Error ? error.message : String(error);
  let type: string | undefined;
  for (let depth = 0; current && depth < 10; depth++) {
    const record = current as { message?: unknown; type?: unknown; cause?: unknown };
    if (typeof record.message === "string" && record.message) message = record.message;
    if (typeof record.type === "string" && record.type) type = record.type;
    current = record.cause;
  }
  return { message, type };
}
