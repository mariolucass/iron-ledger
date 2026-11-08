import "./config/load-env";

async function start(): Promise<void> {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    process.env.OTEL_SERVICE_NAME ??= "iron-ledger-api";
    await import("@opentelemetry/auto-instrumentations-node/register");
  }
  await import("./main.js");
}

void start().catch((error: unknown) => {
  console.error("Falha ao iniciar a API", error);
  process.exitCode = 1;
});
