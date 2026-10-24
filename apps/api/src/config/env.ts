import "./load-env";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  EVENT_BUS: z.enum(["rabbitmq", "memory"]).default("rabbitmq"),
  RABBITMQ_URL: z.string().startsWith("amqp").optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  TEMPORAL_ADDRESS: z.string().default("localhost:7233"),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  TEMPORAL_TASK_QUEUE: z.string().default("iron-ledger-tasks"),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(1_000),
  // Proxies confiáveis à frente da API (o BFF do Next conta como um). Define o IP
  // usado pelo rate limit a partir de `X-Forwarded-For`; 0 usa o IP da conexão.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  // Origens de navegador autorizadas a chamar a API direto (separadas por vírgula).
  // Vazio desliga o CORS: o web fala só com o BFF, que chama a API pelo servidor.
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  OUTBOX_RELAY_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  // Somente para o painel de serviços (/platform/services); a API não depende deles.
  ANALYTICS_PORT: z.coerce.number().int().positive().default(8000),
  ANALYTICS_URL: z.string().url().optional(),
  KAFKA_PORT: z.coerce.number().int().positive().default(9092),
  KAFKA_BROKERS: z.string().optional(),
});

export const env = schema
  .refine((value) => value.EVENT_BUS === "memory" || value.RABBITMQ_URL, {
    path: ["RABBITMQ_URL"],
    message: "Obrigatória quando EVENT_BUS=rabbitmq (use EVENT_BUS=memory para rodar sem broker).",
  })
  .parse(process.env);
