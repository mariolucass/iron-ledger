import type { ModuleFactory } from "../../infra/http/module";
import { CreateCategoryUseCase, ListCategoriesUseCase } from "./application/category.use-cases";
import {
  CommitProductImportUseCase,
  PreviewProductImportUseCase,
} from "./application/product-import.use-cases";
import { GetProductSectionUseCase } from "./application/product-sections";
import {
  ArchiveProductUseCase,
  CreateProductUseCase,
  GetProductLookupsUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from "./application/product.use-cases";
import { CreateUnitUseCase, ListUnitsUseCase } from "./application/unit-of-measure.use-cases";
import { createCategoryRouter } from "./infra/http/category.routes";
import { ProductImportController } from "./infra/http/product-import.controller";
import { ProductController } from "./infra/http/product.controller";
import { createProductRouter } from "./infra/http/product.routes";
import { createUnitRouter } from "./infra/http/unit.routes";
import { PrismaCategoryRepository } from "./infra/repositories/prisma-category.repository";
import { PrismaProductRepository } from "./infra/repositories/prisma-product.repository";
import { PrismaUnitRepository } from "./infra/repositories/prisma-unit.repository";

export const catalogModule: ModuleFactory = ({ env }) => {
  const jwtSecret = env.JWT_SECRET;
  const productRepository = new PrismaProductRepository();
  const productController = new ProductController(
    new ListProductsUseCase(productRepository),
    new GetProductUseCase(productRepository),
    new GetProductLookupsUseCase(productRepository),
    new CreateProductUseCase(productRepository),
    new UpdateProductUseCase(productRepository),
    new ArchiveProductUseCase(productRepository),
    new GetProductSectionUseCase(productRepository, productRepository),
  );
  const productImportController = new ProductImportController(
    new PreviewProductImportUseCase(productRepository),
    new CommitProductImportUseCase(productRepository),
  );
  const categoryRepository = new PrismaCategoryRepository();
  const unitRepository = new PrismaUnitRepository();

  return [
    {
      path: "/products",
      router: createProductRouter(productController, productImportController, jwtSecret),
    },
    {
      path: "/categories",
      router: createCategoryRouter(
        new ListCategoriesUseCase(categoryRepository),
        new CreateCategoryUseCase(categoryRepository),
        jwtSecret,
      ),
    },
    {
      path: "/units-of-measure",
      router: createUnitRouter(
        new ListUnitsUseCase(unitRepository),
        new CreateUnitUseCase(unitRepository),
        jwtSecret,
      ),
    },
  ];
};
