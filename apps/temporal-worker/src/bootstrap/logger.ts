import { createLogger, type Logger as AppLogger } from "@iron-ledger/logger";
import type { LogLevel, LogMetadata, Logger as TemporalLogger } from "@temporalio/worker";

export const logger = createLogger({ service: "temporal-worker" });

const LEVELS: Record<LogLevel, "trace" | "debug" | "info" | "warn" | "error"> = {
  TRACE: "trace",
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/** Encaminha os logs do SDK (worker, workflows e activities) para o logger JSON. */
export function temporalLogger(target: AppLogger = logger.child({ component: "temporal-sdk" })): TemporalLogger {
  const log = (level: LogLevel, message: string, meta?: LogMetadata) => target[LEVELS[level]]({ ...meta }, message);
  return {
    log,
    trace: (message, meta) => log("TRACE", message, meta),
    debug: (message, meta) => log("DEBUG", message, meta),
    info: (message, meta) => log("INFO", message, meta),
    warn: (message, meta) => log("WARN", message, meta),
    error: (message, meta) => log("ERROR", message, meta),
  };
}
