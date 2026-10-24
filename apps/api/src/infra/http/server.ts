import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { createRouter, type RouterDependencies } from "./router";
import {
  PRODUCT_IMPORT_PATH,
  productImportBody,
} from "../../modules/catalog/infra/http/product.routes";

export function createServer(dependencies: RouterDependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ exposedHeaders: ["x-correlation-id", "location"] }));
  app.use(requestLogger);
  // Registrado antes do parser global: com o corpo já lido, o de 1 MB não atua.
  app.use(PRODUCT_IMPORT_PATH, productImportBody);
  app.use(express.json({ limit: "1mb" }));
  app.use(createRouter(dependencies));
  app.use(errorHandler);
  return app;
}
