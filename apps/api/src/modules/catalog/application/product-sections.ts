import { NotFoundError } from "../../../shared/errors/not-found.error";
import type { ProductRepository } from "./product";

export type ProductSection = "inventory" | "movements" | "lots" | "units" | "forecast";

export interface ProductSectionsRepository {
  inventory(id: string): Promise<unknown>;
  movements(id: string, page: number, pageSize: number): Promise<unknown>;
  lots(id: string, page: number, pageSize: number): Promise<unknown>;
  units(id: string): Promise<unknown>;
  forecast(id: string): Promise<unknown>;
}

export class GetProductSectionUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly sections: ProductSectionsRepository,
  ) {}

  async execute(id: string, section: ProductSection, page: number, pageSize: number) {
    if (!(await this.products.findById(id))) throw new NotFoundError("Produto não encontrado");
    switch (section) {
      case "inventory":
        return this.sections.inventory(id);
      case "movements":
        return this.sections.movements(id, page, pageSize);
      case "lots":
        return this.sections.lots(id, page, pageSize);
      case "units":
        return this.sections.units(id);
      case "forecast":
        return this.sections.forecast(id);
    }
  }
}
