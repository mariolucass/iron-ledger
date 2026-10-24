import { AppError } from "../../../shared/errors/domain.error";
import { NotFoundError } from "../../../shared/errors/not-found.error";
import { categorySlug, type CategoryRepository, type CreateCategoryInput, type ListCategoriesQuery } from "./category";

export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}
  execute(query: ListCategoriesQuery) { return this.categories.list(query); }
}

export class CreateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}
  async execute(input: CreateCategoryInput) {
    const parent = input.parentId ? await this.categories.findById(input.parentId) : null;
    if (input.parentId && !parent) throw new NotFoundError("Categoria pai não encontrada");
    if (parent && !parent.isActive) throw new AppError("Categoria pai inativa", 422, "INACTIVE_PARENT_CATEGORY");
    const slug = categorySlug(input.name);
    if (!slug) throw new AppError("Nome inválido para a URL da categoria", 422, "INVALID_CATEGORY_SLUG");
    return this.categories.create({ ...input, slug, path: `${parent?.path ?? ""}/${slug}`, depth: (parent?.depth ?? -1) + 1 });
  }
}
