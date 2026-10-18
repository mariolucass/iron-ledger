import { logger } from "./bootstrap/logger";
import { runWorker } from "./bootstrap/worker";

void runWorker().catch((error) => {
  logger.fatal({ err: error }, "Falha ao iniciar Temporal worker");
  process.exitCode = 1;
});
