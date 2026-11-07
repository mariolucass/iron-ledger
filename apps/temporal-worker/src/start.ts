async function start(): Promise<void> {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    process.env.OTEL_SERVICE_NAME ??= "iron-ledger-temporal-worker";
    await import("@opentelemetry/auto-instrumentations-node/register");
  }
  await import("./worker.js");
}

void start().catch((error: unknown) => {
  console.error("Falha ao iniciar Temporal worker", error);
  process.exitCode = 1;
});
