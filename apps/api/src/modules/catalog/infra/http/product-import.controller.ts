import { handle } from "../../../../infra/http/handle";
import { productImportSchema } from "../../application/product-import";
import type {
  CommitProductImportUseCase,
  PreviewProductImportUseCase,
} from "../../application/product-import.use-cases";

export class ProductImportController {
  constructor(
    private readonly previewImport: PreviewProductImportUseCase,
    private readonly commitImport: CommitProductImportUseCase,
  ) {}

  preview = handle(200, (request) =>
    this.previewImport.execute(productImportSchema.parse(request.body)),
  );
  commit = handle(201, (request) =>
    this.commitImport.execute(productImportSchema.parse(request.body), request.auth!.userId),
  );
}
