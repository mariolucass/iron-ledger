import { Router } from "express";
import { handle } from "../../../../infra/http/handle";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import { createCategorySchema, listCategoriesSchema } from "../../application/category";
import type {
  CreateCategoryUseCase,
  ListCategoriesUseCase,
} from "../../application/category.use-cases";

export function createCategoryRouter(
  list: ListCategoriesUseCase,
  create: CreateCategoryUseCase,
  jwtSecret: string,
): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get(
    "/",
    handle(200, (request) => list.execute(listCategoriesSchema.parse(request.query))),
  );
  router.post(
    "/",
    requireRoles("CATALOG_MANAGER"),
    handle(201, (request) => create.execute(createCategorySchema.parse(request.body))),
  );
  return router;
}
