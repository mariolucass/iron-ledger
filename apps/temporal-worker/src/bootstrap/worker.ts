import { hostname } from "node:os";
import { NativeConnection, Runtime, Worker } from "@temporalio/worker";
import { activityInfo } from "@temporalio/activity";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OpenTelemetryPlugin } from "@temporalio/interceptors-opentelemetry";
import { ServiceTokenProvider } from "../shared/auth/service-token-provider";
import { ApiClient } from "../shared/http/api-client";
import { loadConfig } from "./config";
import { logger, temporalLogger } from "./logger";
import { composeActivities, discoverModules } from "./module-registry";
import { bundleModuleWorkflows } from "./workflow-bundle";

/** O workflowId é o ID da transação: correlaciona todas as chamadas à API. */
const correlationId = () => activityInfo().workflowExecution?.workflowId;

export async function runWorker() {
  const config = loadConfig();
  Runtime.install({ logger: temporalLogger() });

  const tokens = new ServiceTokenProvider({
    apiUrl: config.apiUrl,
    email: config.serviceEmail,
    password: config.servicePassword,
  });
  const api = new ApiClient(config.apiUrl, tokens);
  const modules = discoverModules();
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const tracingEnabled = Boolean(otlpEndpoint);
  const traceEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    ?? (otlpEndpoint ? `${otlpEndpoint.replace(/\/$/, "")}/v1/traces` : undefined);
  const telemetryPlugin = traceEndpoint
    ? new OpenTelemetryPlugin({
      resource: new Resource({ "service.name": process.env.OTEL_SERVICE_NAME ?? "iron-ledger-temporal-worker" }),
      spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: traceEndpoint })),
    })
    : undefined;
  const activities = composeActivities(modules, {
    api,
    logger,
    env: process.env,
    correlationId,
  });
  const connection = await NativeConnection.connect({ address: config.temporalAddress });
  try {
    const worker = await Worker.create({
      connection,
      namespace: config.namespace,
      taskQueue: config.taskQueue,
      identity: `iron-ledger-worker@${hostname()}:${process.pid}`,
      maxConcurrentActivityTaskExecutions: config.maxConcurrentActivities,
      maxConcurrentWorkflowTaskExecutions: config.maxConcurrentWorkflowTasks,
      shutdownGraceTime: config.shutdownGraceMs,
      workflowBundle: await bundleModuleWorkflows(modules, tracingEnabled),
      activities,
      ...(telemetryPlugin ? { plugins: [telemetryPlugin] } : {}),
    });

    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.once(signal, () => {
        logger.info({ signal }, "Encerrando worker; aguardando activities em andamento");
        worker.shutdown();
      });
    }

    logger.info(
      {
        taskQueue: config.taskQueue,
        namespace: config.namespace,
        apiUrl: config.apiUrl,
        modules: modules.map(({ name }) => name),
      },
      "Temporal worker pronto",
    );
    await worker.run();
    logger.info({}, "Temporal worker encerrado");
  } finally {
    await connection.close();
  }
}
