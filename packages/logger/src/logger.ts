import pino, { type DestinationStream, type Logger as PinoLogger } from "pino";
import { getContext } from "./context";

export type Logger = PinoLogger;

export interface LoggerOptions {
  /** Nome lógico do serviço (`api`, `temporal-worker`). */
  service: string;
  level?: string;
  /** Campos fixos adicionais (versão, região, instância). */
  base?: Record<string, unknown>;
  /** Destino alternativo, útil em testes. */
  destination?: DestinationStream;
}

/** Caminhos nunca registrados em claro. */
export const REDACTED_PATHS = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.secret",
  "*.authorization",
  "headers.authorization",
  "headers.cookie",
  "req.headers.authorization",
  "req.headers.cookie",
];

/**
 * Logger JSON estruturado. Campos do contexto assíncrono (correlationId,
 * userId, workflowId) são mesclados em cada linha via `mixin`.
 */
export function createLogger(options: LoggerOptions): Logger {
  return pino(
    {
      name: options.service,
      level: options.level ?? process.env.LOG_LEVEL ?? "info",
      messageKey: "message",
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: options.service,
        env: process.env.NODE_ENV ?? "development",
        pid: process.pid,
        ...options.base,
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
      serializers: { err: pino.stdSerializers.err, error: pino.stdSerializers.err },
      redact: { paths: REDACTED_PATHS, censor: "[REDACTED]" },
      mixin: () => ({ ...getContext() }),
    },
    options.destination,
  );
}
