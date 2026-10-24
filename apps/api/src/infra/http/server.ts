import cors from "cors";
import express from "express";
import { env } from "../../config/env";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { securityHeaders } from "./middlewares/security-headers.middleware";
import { createRouter, type RouterDependencies } from "./router";
import {
  PRODUCT_IMPORT_PATH,
  productImportBody,
} from "../../modules/catalog/infra/http/product.routes";

export function createServer(dependencies: RouterDependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use(securityHeaders);
  app.use(
    cors({
      origin: env.CORS_ALLOWED_ORIGINS.length > 0 ? env.CORS_ALLOWED_ORIGINS : false,
      exposedHeaders: ["x-correlation-id", "location", "retry-after"],
    }),
  );
  app.use(requestLogger);
  // Registrado antes do parser global: com o corpo já lido, o de 1 MB não atua.
  app.use(PRODUCT_IMPORT_PATH, productImportBody);
  app.use(express.json({ limit: "1mb" }));
  app.use(createRouter(dependencies));
  app.use(errorHandler);
  return app;
}
