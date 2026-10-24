import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import { productImportSchema } from "../../application/product-import";
import type { CommitProductImportUseCase, PreviewProductImportUseCase } from "../../application/product-import.use-cases";

export class ProductImportController {
  constructor(
    private readonly previewImport: PreviewProductImportUseCase,
    private readonly commitImport: CommitProductImportUseCase,
  ) {}

  preview = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      response.status(200).json(await this.previewImport.execute(productImportSchema.parse(request.body)));
    } catch (error) {
      next(error);
    }
  };

  commit = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      response.status(201).json(await this.commitImport.execute(productImportSchema.parse(request.body), request.auth!.userId));
    } catch (error) {
      next(error);
    }
  };
}
