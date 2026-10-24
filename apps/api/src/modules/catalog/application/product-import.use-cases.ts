import { AppError } from "../../../shared/errors/domain.error";
import { ValidationError } from "../../../shared/errors/validation.error";
import {
  missingRequired,
  parseRows,
  planImport,
  resolveColumns,
  summarize,
  type ProductImportReport,
  type ProductImportRepository,
  type ProductImportRequest,
} from "./product-import";

async function buildImport(repository: ProductImportRepository, request: ProductImportRequest) {
  const [header = [], ...body] = request.rows;
  const columns = resolveColumns(header, request.columns);
  const missing = missingRequired(columns);
  if (!body.length) throw new ValidationError("A planilha não tem linhas de dados", "IMPORT_EMPTY");

  const parsed = parseRows([header, ...body], columns);
  const units = await repository.activeUnits();
  const defaultUnit = units.find((unit) => unit.id === request.options.defaultUnitId);
  if (!defaultUnit) throw new ValidationError("Unidade de medida padrão não encontrada", "UNIT_NOT_FOUND");

  const skus = [...new Set(parsed.flatMap((row) => (row.sku ? [row.sku] : [])))];
  const paths = [...new Set(parsed.flatMap((row) => {
    if (!row.categoryPath) return [];
    const [, root] = row.categoryPath.split("/");
    return [`/${root}`, row.categoryPath];
  }))];
  const [existingSkus, categories] = await Promise.all([repository.existingSkus(skus), repository.categoriesByPath(paths)]);

  const { plan, results } = planImport(parsed, {
    defaultUnit,
    unitsByCode: new Map(units.map((unit) => [unit.code.toLowerCase(), unit])),
    existingSkus,
    categories,
  }, request.options);

  const report: ProductImportReport = {
    columns,
    missingRequired: missing,
    rows: results,
    summary: summarize(results),
    categoriesToCreate: plan.categories.map((category) => category.label),
    committed: false,
  };
  return { plan, report };
}

/** Valida a planilha e mostra o que cada linha fará, sem gravar nada. */
export class PreviewProductImportUseCase {
  constructor(private readonly repository: ProductImportRepository) {}

  async execute(request: ProductImportRequest) {
    return (await buildImport(this.repository, request)).report;
  }
}

/** Revalida no servidor e grava tudo ou nada. */
export class CommitProductImportUseCase {
  constructor(private readonly repository: ProductImportRepository) {}

  async execute(request: ProductImportRequest, actorId: string) {
    const { plan, report } = await buildImport(this.repository, request);
    if (report.missingRequired.length) {
      throw new ValidationError("Mapeie as colunas de SKU e nome antes de importar", "IMPORT_MISSING_COLUMNS");
    }
    if (report.summary.error) {
      throw new AppError(
        `A planilha tem ${report.summary.error} linha(s) com erro. Corrija e gere a prévia novamente.`,
        422,
        "IMPORT_HAS_ERRORS",
      );
    }
    if (plan.creates.length || plan.updates.length) await this.repository.applyImport(plan, actorId);
    return { ...report, committed: true };
  }
}
