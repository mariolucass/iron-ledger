import { z, type ZodIssue } from "zod";
import { categorySlug } from "./category";
import {
  createProductSchema,
  PRODUCT_STATUSES,
  updateProductSchema,
  type CreateProductInput,
  type ProductStatus,
  type UnitOption,
  type UpdateProductInput,
} from "./product";

export const MAX_IMPORT_ROWS = 5_000;

export const PRODUCT_IMPORT_FIELDS = [
  "sku", "name", "category", "subcategory", "brand", "standardCost", "salePrice",
  "status", "unit", "description", "ncm", "minStock",
] as const;

export type ProductImportField = (typeof PRODUCT_IMPORT_FIELDS)[number];

export const PRODUCT_IMPORT_LABELS: Record<ProductImportField, string> = {
  sku: "SKU", name: "Nome", category: "Categoria", subcategory: "Subcategoria", brand: "Marca/Fornecedor",
  standardCost: "Custo unitário", salePrice: "Preço de venda", status: "Status", unit: "Unidade",
  description: "Descrição", ncm: "NCM", minStock: "Estoque mínimo",
};

const REQUIRED_FIELDS: ProductImportField[] = ["sku", "name"];

/** Cabeçalhos conhecidos, já normalizados por `normalizeHeader`. */
const HEADER_ALIASES: Record<ProductImportField, string[]> = {
  sku: ["sku", "sku codigo", "codigo sku", "codigo", "cod", "cod produto", "codigo do produto", "referencia", "ref"],
  name: ["nome do produto", "nome", "produto", "descricao do produto", "titulo"],
  category: ["categoria", "grupo", "departamento", "familia"],
  subcategory: ["subcategoria", "sub categoria", "subgrupo", "sub grupo"],
  brand: ["marca fornecedor", "marca", "fornecedor", "fabricante", "marca fabricante"],
  standardCost: ["custo unitario", "custo", "preco de custo", "custo padrao", "valor de custo"],
  salePrice: ["preco de venda", "preco venda", "valor de venda", "preco", "valor"],
  status: ["status", "situacao", "ativo"],
  unit: ["unidade", "unidade de medida", "un", "und", "unid"],
  description: ["descricao", "observacao", "observacoes", "detalhes"],
  ncm: ["ncm", "codigo ncm"],
  minStock: ["estoque minimo", "minimo", "est minimo"],
};

const ALIAS_INDEX = new Map(
  Object.entries(HEADER_ALIASES).flatMap(([field, aliases]) => aliases.map((alias) => [alias, field as ProductImportField])),
);

const cell = z.union([z.string().max(2_000), z.number().finite(), z.boolean(), z.null()]);

export const productImportSchema = z.object({
  /** Primeira linha = cabeçalho. Células chegam como o leitor da planilha as entregou. */
  rows: z.array(z.array(cell).max(60)).min(1).max(MAX_IMPORT_ROWS + 1),
  /** Mapeamento explícito por índice de coluna; ausente, o cabeçalho é reconhecido pelos apelidos. */
  columns: z.array(z.enum(PRODUCT_IMPORT_FIELDS).nullable()).max(60).optional(),
  options: z.object({
    defaultUnitId: z.string().uuid(),
    onExisting: z.enum(["skip", "update", "error"]).default("skip"),
    createCategories: z.boolean().default(true),
  }),
});

export type ProductImportRequest = z.infer<typeof productImportSchema>;
export type Cell = z.infer<typeof cell>;

export type ImportRowAction = "create" | "update" | "skip" | "error";

export type ImportRowResult = {
  /** Linha na planilha, contando o cabeçalho como 1. */
  line: number;
  sku: string | null;
  name: string | null;
  category: string | null;
  action: ImportRowAction;
  errors: string[];
  warnings: string[];
};

export type ProductImportReport = {
  columns: { index: number; header: string; field: ProductImportField | null }[];
  missingRequired: ProductImportField[];
  rows: ImportRowResult[];
  summary: Record<ImportRowAction, number> & { total: number };
  categoriesToCreate: string[];
  committed: boolean;
};

type ResolvedColumn = ProductImportReport["columns"][number];

export type NewCategory = { path: string; name: string; parentPath: string | null; label: string };

export type ProductImportPlan = {
  categories: NewCategory[];
  creates: (CreateProductInput & { unit: string; categoryPath: string | null })[];
  updates: { sku: string; input: UpdateProductInput; categoryPath: string | null | undefined }[];
};

export interface ProductImportRepository {
  activeUnits(): Promise<UnitOption[]>;
  existingSkus(skus: string[]): Promise<Set<string>>;
  categoriesByPath(paths: string[]): Promise<Map<string, { isActive: boolean }>>;
  /** Grava tudo numa transação; lança AppError 409 em conflito de SKU concorrente. */
  applyImport(plan: ProductImportPlan, actorId: string): Promise<void>;
}

// ─── Normalização ────────────────────────────────────────────────────────────

export const normalizeHeader = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function resolveColumns(header: Cell[], explicit?: (ProductImportField | null)[]): ResolvedColumn[] {
  const taken = new Set<ProductImportField>();
  return header.map((value, index) => {
    const text = value == null ? "" : String(value).trim();
    const field = explicit ? (explicit[index] ?? null) : (ALIAS_INDEX.get(normalizeHeader(text)) ?? null);
    // A primeira coluna vence quando duas apontam para o mesmo campo.
    const unique = field && !taken.has(field) ? field : null;
    if (unique) taken.add(unique);
    return { index, header: text, field: unique };
  });
}

const text = (value: Cell | undefined): string | null => {
  if (value == null) return null;
  const result = String(value).trim();
  return result.length ? result : null;
};

/**
 * Aceita números da planilha e textos em pt-BR ou en-US:
 * "25,00", "1.234,56", "R$ 59,90", "59.90", "1.234" (milhar).
 */
export function parseDecimal(value: Cell | undefined): number | null | undefined {
  if (typeof value === "number") return value;
  const raw = text(value);
  if (raw === null) return null;
  let cleaned = raw.replace(/R\$|\s| /gi, "");
  const negative = /^-/.test(cleaned);
  cleaned = cleaned.replace(/^-/, "");
  if (!/^[\d.,]+$/.test(cleaned)) return undefined;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    const [integer = "", fraction = "", ...rest] = cleaned.split(decimal);
    const grouped = integer.split(thousands);
    if (rest.length || grouped.slice(1).some((group) => group.length !== 3) || grouped[0]!.length > 3) return undefined;
    cleaned = `${grouped.join("")}.${fraction}`;
  } else if (lastComma >= 0) {
    if ((cleaned.match(/,/g) ?? []).length > 1) cleaned = cleaned.replace(/,/g, "");
    else cleaned = cleaned.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "");
  }
  if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : undefined;
}

const STATUS_ALIASES: Record<string, ProductStatus> = {
  ativo: "ACTIVE", ativa: "ACTIVE", active: "ACTIVE", sim: "ACTIVE", s: "ACTIVE", "1": "ACTIVE", true: "ACTIVE",
  inativo: "DISCONTINUED", inativa: "DISCONTINUED", inactive: "DISCONTINUED", descontinuado: "DISCONTINUED",
  discontinued: "DISCONTINUED", nao: "DISCONTINUED", n: "DISCONTINUED", "0": "DISCONTINUED", false: "DISCONTINUED",
  rascunho: "DRAFT", draft: "DRAFT", arquivado: "ARCHIVED", archived: "ARCHIVED",
};

export function parseStatus(value: Cell | undefined): ProductStatus | null | undefined {
  const raw = text(value);
  if (raw === null) return null;
  const upper = raw.toUpperCase();
  if ((PRODUCT_STATUSES as readonly string[]).includes(upper)) return upper as ProductStatus;
  return STATUS_ALIASES[normalizeHeader(raw)];
}

// ─── Linhas ──────────────────────────────────────────────────────────────────

export type ParsedRow = {
  line: number;
  values: Partial<Record<ProductImportField, Cell>>;
  sku: string | null;
  categoryPath: string | null;
  categoryLabel: string | null;
  errors: string[];
};

export function parseRows(rows: Cell[][], columns: ResolvedColumn[]): ParsedRow[] {
  const mapped = columns.filter((column) => column.field);
  return rows.slice(1).flatMap((row, offset) => {
    if (row.every((value) => text(value) === null)) return [];
    const values: ParsedRow["values"] = {};
    for (const column of mapped) values[column.field!] = row[column.index] ?? null;

    const errors: string[] = [];
    const category = text(values.category);
    const subcategory = text(values.subcategory);
    let categoryPath: string | null = null;
    if (subcategory && !category) errors.push("Subcategoria informada sem categoria");
    if (category) {
      const parent = categorySlug(category);
      const child = subcategory ? categorySlug(subcategory) : null;
      if (!parent || (subcategory && !child)) errors.push("Nome de categoria inválido");
      else categoryPath = child ? `/${parent}/${child}` : `/${parent}`;
    }
    return [{
      line: offset + 2,
      values,
      sku: text(values.sku)?.toUpperCase() ?? null,
      categoryPath,
      categoryLabel: category ? [category, subcategory].filter(Boolean).join(" › ") : null,
      errors,
    }];
  });
}

const FIELD_LABEL_BY_SCHEMA_KEY: Record<string, string> = {
  sku: PRODUCT_IMPORT_LABELS.sku, name: PRODUCT_IMPORT_LABELS.name, brand: PRODUCT_IMPORT_LABELS.brand,
  standardCost: PRODUCT_IMPORT_LABELS.standardCost, salePrice: PRODUCT_IMPORT_LABELS.salePrice,
  status: PRODUCT_IMPORT_LABELS.status, description: PRODUCT_IMPORT_LABELS.description, ncm: PRODUCT_IMPORT_LABELS.ncm,
  minStock: PRODUCT_IMPORT_LABELS.minStock,
};

const issueMessage = (issue: ZodIssue) => {
  const label = FIELD_LABEL_BY_SCHEMA_KEY[String(issue.path[0])] ?? String(issue.path[0] ?? "Linha");
  const message = issue.code === "too_small" && issue.type === "number" ? "não pode ser negativo" : issue.message;
  return `${label}: ${message}`;
};

export type ImportContext = {
  defaultUnit: UnitOption;
  unitsByCode: Map<string, UnitOption>;
  existingSkus: Set<string>;
  categories: Map<string, { isActive: boolean }>;
};

/** Decide o destino de cada linha sem tocar no banco. */
export function planImport(parsed: ParsedRow[], context: ImportContext, options: ProductImportRequest["options"]) {
  const plan: ProductImportPlan = { categories: [], creates: [], updates: [] };
  const results: ImportRowResult[] = [];
  const seen = new Map<string, number>();
  const pending = new Map<string, NewCategory>();

  const ensureCategory = (row: ParsedRow, errors: string[]) => {
    if (!row.categoryPath) return;
    const segments = row.categoryPath.split("/").slice(1);
    const names = [text(row.values.category)!, text(row.values.subcategory)];
    segments.forEach((_segment, depth) => {
      const path = `/${segments.slice(0, depth + 1).join("/")}`;
      const existing = context.categories.get(path);
      if (existing) {
        if (!existing.isActive) errors.push(`Categoria "${names[depth]}" está inativa`);
        return;
      }
      if (!options.createCategories) {
        errors.push(`Categoria "${names[depth]}" não cadastrada`);
        return;
      }
      if (!pending.has(path)) {
        pending.set(path, {
          path, name: names[depth]!, parentPath: depth === 0 ? null : `/${segments[0]}`,
          label: names.slice(0, depth + 1).join(" › "),
        });
      }
    });
  };

  for (const row of parsed) {
    const errors = [...row.errors];
    const warnings: string[] = [];
    const v = row.values;
    const result = (action: ImportRowAction): ImportRowResult => ({
      line: row.line, sku: row.sku, name: text(v.name), category: row.categoryLabel,
      action: errors.length ? "error" : action, errors, warnings,
    });

    if (!row.sku) errors.push("SKU: obrigatório");
    else if (seen.has(row.sku)) errors.push(`SKU repetido na planilha (linha ${seen.get(row.sku)})`);
    else seen.set(row.sku, row.line);

    const numbers: Partial<Record<"standardCost" | "salePrice" | "minStock", number | null>> = {};
    for (const key of ["standardCost", "salePrice", "minStock"] as const) {
      if (!(key in v)) continue;
      const parsedNumber = parseDecimal(v[key]);
      if (parsedNumber === undefined) errors.push(`${PRODUCT_IMPORT_LABELS[key]}: "${text(v[key])}" não é um número`);
      else numbers[key] = parsedNumber;
    }
    const status = "status" in v ? parseStatus(v.status) : null;
    if (status === undefined) errors.push(`Status: "${text(v.status)}" não reconhecido (use Ativo, Inativo, Rascunho ou Arquivado)`);

    const unitCode = text(v.unit);
    const unit = unitCode ? context.unitsByCode.get(unitCode.toLowerCase()) : context.defaultUnit;
    if (!unit) errors.push(`Unidade "${unitCode}" não cadastrada`);

    const { standardCost, salePrice } = numbers;
    if (standardCost != null && salePrice != null && salePrice < standardCost) warnings.push("Preço de venda abaixo do custo");

    const exists = row.sku !== null && context.existingSkus.has(row.sku);
    // Linha ignorada não bloqueia a importação, mesmo com dados ruins.
    if (exists && options.onExisting === "skip") {
      results.push({ ...result("skip"), action: "skip", errors: [], warnings: ["SKU já cadastrado; linha ignorada"] });
      continue;
    }
    if (exists && options.onExisting === "error") errors.push("SKU já cadastrado");

    ensureCategory(row, errors);

    // Célula vazia não apaga dado em atualização; na criação vira o padrão do schema.
    const fields = {
      name: text(v.name) ?? undefined,
      description: text(v.description) ?? undefined,
      brand: text(v.brand) ?? undefined,
      ncm: text(v.ncm) ?? undefined,
      status: status ?? undefined,
      standardCost: numbers.standardCost ?? undefined,
      salePrice: numbers.salePrice ?? undefined,
      minStock: numbers.minStock ?? undefined,
    };

    if (exists) {
      const parsedUpdate = updateProductSchema.safeParse(fields);
      if (!parsedUpdate.success) errors.push(...parsedUpdate.error.issues.map(issueMessage));
      if (unitCode) warnings.push("A unidade de produtos existentes não é alterada pela importação");
      if (!errors.length && parsedUpdate.success) {
        plan.updates.push({ sku: row.sku!, input: parsedUpdate.data, categoryPath: row.categoryPath ?? undefined });
      }
      results.push(result("update"));
      continue;
    }

    if (!fields.name) errors.push("Nome: obrigatório");
    const parsedCreate = createProductSchema.safeParse({
      ...fields, sku: row.sku ?? "", name: fields.name ?? "", baseUnitId: unit?.id ?? context.defaultUnit.id,
      status: fields.status ?? "ACTIVE",
    });
    if (!parsedCreate.success) {
      errors.push(...parsedCreate.error.issues.filter((issue) => !(issue.path[0] === "name" && !fields.name)).map(issueMessage));
    }
    if (!errors.length && parsedCreate.success && unit) {
      plan.creates.push({ ...parsedCreate.data, unit: unit.code, categoryPath: row.categoryPath });
    }
    results.push(result("create"));
  }

  // Só cria categorias usadas por linhas que serão gravadas.
  const used = new Set([...plan.creates.map((row) => row.categoryPath), ...plan.updates.map((row) => row.categoryPath)]);
  const needed = new Set<string>();
  for (const path of used) {
    if (!path) continue;
    needed.add(path);
    const parent = pending.get(path)?.parentPath;
    if (parent) needed.add(parent);
  }
  plan.categories = [...pending.values()]
    .filter((category) => needed.has(category.path))
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length);

  return { plan, results };
}

export function summarize(results: ImportRowResult[]): ProductImportReport["summary"] {
  const summary = { total: results.length, create: 0, update: 0, skip: 0, error: 0 };
  for (const row of results) summary[row.action] += 1;
  return summary;
}

export const missingRequired = (columns: ResolvedColumn[]) =>
  REQUIRED_FIELDS.filter((field) => !columns.some((column) => column.field === field));
