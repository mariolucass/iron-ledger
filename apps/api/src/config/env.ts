import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// The API can run from apps/api, while the shared .env lives at the workspace root.
// Keep existing process variables and an optional apps/api/.env ahead of root defaults.
config({ path: resolve(__dirname, "../../.env") });
config({ path: resolve(__dirname, "../../../../.env") });

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
});

export const env = schema.parse(process.env);
