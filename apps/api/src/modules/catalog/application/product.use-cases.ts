import { AppError } from "../../../shared/errors/domain.error";
import { NotFoundError } from "../../../shared/errors/not-found.error";
import { ValidationError } from "../../../shared/errors/validation.error";
import type { CreateProductInput, ListProductsQuery, ProductRepository, UpdateProductInput } from "./product";

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}
  execute(query: ListProductsQuery) {
    return this.products.list(query);
  }
}

export class GetProductUseCase {
  constructor(private readonly products: ProductRepository) {}
  async execute(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError("Produto não encontrado");
    return product;
  }
}

export class GetProductLookupsUseCase {
  constructor(private readonly products: ProductRepository) {}
  execute() {
    return this.products.lookups();
  }
}

async function resolveReferences(
  products: ProductRepository,
  refs: { baseUnitId?: string; categoryId?: string | null },
) {
  let unit: string | undefined;
  if (refs.baseUnitId) {
    const found = await products.findUnit(refs.baseUnitId);
    if (!found) throw new ValidationError("Unidade de medida não encontrada", "UNIT_NOT_FOUND");
    unit = found.code;
  }
  if (refs.categoryId && !(await products.categoryExists(refs.categoryId))) {
    throw new ValidationError("Categoria não encontrada", "CATEGORY_NOT_FOUND");
  }
  return { unit };
}

export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: CreateProductInput, actorId: string) {
    if (!input.baseUnitId) throw new ValidationError("Informe a unidade de medida", "UNIT_REQUIRED");
    if (!input.sku) throw new ValidationError("Informe o SKU", "SKU_REQUIRED");
    if (!input.name) throw new ValidationError("Informe o nome do produto", "NAME_REQUIRED");
    const { unit } = await resolveReferences(this.products, input);
    return this.products.create({ ...input, unit: unit!, actorId });
  }
}

export class UpdateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string, input: UpdateProductInput, actorId: string) {
    const current = await this.products.findById(id);
    if (!current) throw new NotFoundError("Produto não encontrado");

    // A faixa min/max precisa valer também quando só um dos lados é enviado.
    const minStock = input.minStock ?? current.minStock;
    const maxStock = input.maxStock === undefined ? current.maxStock : input.maxStock;
    if (maxStock != null && maxStock < minStock) {
      throw new AppError("O estoque máximo deve ser maior ou igual ao mínimo", 422, "INVALID_STOCK_RANGE");
    }

    const { unit } = await resolveReferences(this.products, input);
    return this.products.update(id, { ...input, unit, actorId });
  }
}

/** Arquivar preserva o histórico (movimentos, saldos) e tira o produto de circulação. */
export class ArchiveProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string, actorId: string) {
    if (!(await this.products.findById(id))) throw new NotFoundError("Produto não encontrado");
    return this.products.update(id, { status: "ARCHIVED", actorId });
  }
}
