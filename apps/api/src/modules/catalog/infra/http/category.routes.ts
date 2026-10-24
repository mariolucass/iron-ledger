import { Router } from "express";
import { z } from "zod";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import { createCategorySchema, listCategoriesSchema } from "../../application/category";
import type { CreateCategoryUseCase, ListCategoriesUseCase } from "../../application/category.use-cases";

export function createCategoryRouter(list: ListCategoriesUseCase, create: CreateCategoryUseCase, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", async (request, response, next) => {
    try { response.json(await list.execute(listCategoriesSchema.parse(request.query))); } catch (error) { next(error); }
  });
  router.post("/", requireRoles("CATALOG_MANAGER"), async (request, response, next) => {
    try { response.status(201).json(await create.execute(createCategorySchema.parse(request.body))); } catch (error) { next(error); }
  });
  return router;
}
