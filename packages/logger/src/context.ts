import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Metadados propagados por toda a execução de uma request, mensagem ou activity.
 * Tudo o que estiver aqui aparece automaticamente em cada linha de log.
 */
export type LogContext = {
  correlationId?: string;
  causationId?: string;
  requestId?: string;
  userId?: string;
  workflowId?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<LogContext>();

/** Executa `run` com o contexto informado, herdando o contexto atual. */
export function runWithContext<T>(context: LogContext, run: () => T): T {
  return storage.run({ ...storage.getStore(), ...context }, run);
}

export function getContext(): LogContext | undefined {
  return storage.getStore();
}

/** Acrescenta campos ao contexto corrente (ex.: `userId` após autenticar). */
export function setContextValue(key: string, value: unknown): void {
  const store = storage.getStore();
  if (store) store[key] = value;
}
