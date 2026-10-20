import "./load-env";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  RABBITMQ_URL: z.string().startsWith("amqp"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  TEMPORAL_ADDRESS: z.string().default("localhost:7233"),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  TEMPORAL_TASK_QUEUE: z.string().default("iron-ledger-tasks"),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(1_000),
  OUTBOX_RELAY_ENABLED: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
});

export const env = schema.parse(process.env);
