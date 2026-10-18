import { createLogger } from "@iron-ledger/logger";

/** Logger da API. O contexto da request (correlationId, userId) entra em cada linha. */
export const logger = createLogger({ service: "api" });
