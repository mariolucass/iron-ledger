import cors from "cors";
import express from "express";
import type { RabbitMqClient } from "../messaging/rabbitmq.client";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { createRouter } from "./router";

export function createServer(rabbitMq: RabbitMqClient) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(createRouter(rabbitMq));
  app.use(errorHandler);
  return app;
}
