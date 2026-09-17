import "dotenv/config";
import { env } from "./config/env";
import { prisma } from "./infra/database/prisma.client";
import { createServer } from "./infra/http/server";
import { RabbitMqClient } from "./infra/messaging/rabbitmq.client";

async function bootstrap(): Promise<void> {
  const rabbitMq = new RabbitMqClient(env.RABBITMQ_URL);
  await prisma.$connect();
  await rabbitMq.connect();

  const server = createServer(rabbitMq).listen(env.PORT, "0.0.0.0", () => {
    console.log(`iron-ledger API disponível em http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} recebido; encerrando...`);
    server.close(async () => {
      await rabbitMq.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch(async (error) => {
  console.error("Falha ao iniciar a API", error);
  await prisma.$disconnect();
  process.exit(1);
});
