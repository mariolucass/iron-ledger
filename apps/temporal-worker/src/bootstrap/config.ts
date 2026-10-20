export interface WorkerConfig {
  temporalAddress: string;
  namespace: string;
  taskQueue: string;
  apiUrl: string;
  serviceEmail: string;
  servicePassword: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const required = (value: string | undefined, label: string) => {
    if (!value?.trim()) throw new Error(`Configuração ausente: ${label}.`);
    return value;
  };
  const apiUrl = new URL(env.API_URL ?? "http://localhost:3000");
  if (!["http:", "https:"].includes(apiUrl.protocol))
    throw new Error("API_URL deve usar HTTP ou HTTPS.");
  // Preserve local setups while allowing an independently provisioned service user.
  const explicitService =
    env.WORKER_SERVICE_EMAIL !== undefined || env.WORKER_SERVICE_PASSWORD !== undefined;
  return {
    temporalAddress: required(env.TEMPORAL_ADDRESS ?? "localhost:7233", "TEMPORAL_ADDRESS"),
    namespace: required(env.TEMPORAL_NAMESPACE ?? "default", "TEMPORAL_NAMESPACE"),
    taskQueue: required(env.TEMPORAL_TASK_QUEUE ?? "iron-ledger-tasks", "TEMPORAL_TASK_QUEUE"),
    apiUrl: apiUrl.toString(),
    serviceEmail: required(
      explicitService ? env.WORKER_SERVICE_EMAIL : env.SEED_ADMIN_EMAIL,
      "WORKER_SERVICE_EMAIL",
    ).trim(),
    servicePassword: required(
      explicitService ? env.WORKER_SERVICE_PASSWORD : env.SEED_ADMIN_PASSWORD,
      "WORKER_SERVICE_PASSWORD",
    ),
  };
}
