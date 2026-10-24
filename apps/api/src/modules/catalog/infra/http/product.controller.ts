import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import {
  createProductSchema,
  listProductsSchema,
  updateProductSchema,
} from "../../application/product";
import { GetProductSectionUseCase } from "../../application/product-sections";
import type {
  ArchiveProductUseCase,
  CreateProductUseCase,
  GetProductLookupsUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from "../../application/product.use-cases";

const idSchema = z.object({ id: z.string().uuid() });
const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly getLookups: GetProductLookupsUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly archiveProduct: ArchiveProductUseCase,
    private readonly getSection: GetProductSectionUseCase,
  ) {}

  list = handle(200, (request) =>
    this.listProducts.execute(listProductsSchema.parse(request.query)),
  );
  lookups = handle(200, () => this.getLookups.execute());
  get = handle(200, (request) => this.getProduct.execute(idSchema.parse(request.params).id));
  section = handle(200, (request) => {
    const params = idSchema
      .extend({ section: z.enum(["inventory", "movements", "lots", "units", "forecast"]) })
      .parse(request.params);
    const query = pageSchema.parse(request.query);
    return this.getSection.execute(params.id, params.section, query.page, query.pageSize);
  });
  create = handle(201, (request) =>
    this.createProduct.execute(createProductSchema.parse(request.body), request.auth!.userId),
  );
  update = handle(200, (request) =>
    this.updateProduct.execute(
      idSchema.parse(request.params).id,
      updateProductSchema.parse(request.body),
      request.auth!.userId,
    ),
  );
  archive = handle(200, (request) =>
    this.archiveProduct.execute(idSchema.parse(request.params).id, request.auth!.userId),
  );
}
