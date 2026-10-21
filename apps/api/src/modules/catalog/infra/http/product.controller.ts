import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import { createProductSchema, listProductsSchema, updateProductSchema } from "../../application/product";
import type {
  ArchiveProductUseCase,
  CreateProductUseCase,
  GetProductLookupsUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from "../../application/product.use-cases";

const idSchema = z.object({ id: z.string().uuid() });

type Handler = (request: AuthenticatedRequest, response: Response, next: NextFunction) => Promise<void>;

export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly getLookups: GetProductLookupsUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly archiveProduct: ArchiveProductUseCase,
  ) {}

  private handle(status: number, run: (request: AuthenticatedRequest) => Promise<unknown>): Handler {
    return async (request, response, next) => {
      try {
        response.status(status).json(await run(request));
      } catch (error) {
        next(error);
      }
    };
  }

  list = this.handle(200, (request) => this.listProducts.execute(listProductsSchema.parse(request.query)));
  lookups = this.handle(200, () => this.getLookups.execute());
  get = this.handle(200, (request) => this.getProduct.execute(idSchema.parse(request.params).id));
  create = this.handle(201, (request) =>
    this.createProduct.execute(createProductSchema.parse(request.body), request.auth!.userId),
  );
  update = this.handle(200, (request) =>
    this.updateProduct.execute(idSchema.parse(request.params).id, updateProductSchema.parse(request.body), request.auth!.userId),
  );
  archive = this.handle(200, (request) =>
    this.archiveProduct.execute(idSchema.parse(request.params).id, request.auth!.userId),
  );
}
