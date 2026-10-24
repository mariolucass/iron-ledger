import { describe, expect, it } from "vitest";
import {
  parseDecimal,
  parseStatus,
  resolveColumns,
  type Cell,
  type ProductImportPlan,
  type ProductImportRepository,
  type ProductImportRequest,
} from "./product-import";
import { CommitProductImportUseCase, PreviewProductImportUseCase } from "./product-import.use-cases";

const unitId = "8cf0bdf3-8d63-4d29-a820-7346144d75e8";

const HEADER = ["SKU (Código)", "Nome do Produto", "Categoria", "Subcategoria", "Marca/Fornecedor", "Custo Unitário", "Preço de Venda", "Status"];
const SAMPLE: Cell[][] = [
  HEADER,
  ["CAM-PT-M", "Camiseta Preta M", "Vestuário", "Camisetas", "Marca X", "25,00", "59,90", "Ativo"],
  ["TEN-BR-40", "Tênis Branco 40", "Calçados", "Tênis", "Marca Y", "120,00", "299,90", "Ativo"],
];

function repository({ skus = [] as string[], categories = {} as Record<string, boolean> } = {}) {
  const applied: ProductImportPlan[] = [];
  const repo: ProductImportRepository = {
    activeUnits: async () => [
      { id: unitId, code: "un", name: "Unidade", type: "UNIT", precision: 0 },
      { id: "2b7b6f62-8a7c-4c1f-9f55-0f1ce4a3c0b1", code: "kg", name: "Quilograma", type: "WEIGHT", precision: 3 },
    ],
    existingSkus: async (requested) => new Set(requested.filter((sku) => skus.includes(sku))),
    categoriesByPath: async (paths) =>
      new Map(paths.filter((path) => path in categories).map((path) => [path, { isActive: categories[path]! }])),
    applyImport: async (plan) => { applied.push(plan); },
  };
  return { repo, applied };
}

const request = (rows: Cell[][], options: Partial<ProductImportRequest["options"]> = {}): ProductImportRequest => ({
  rows, options: { defaultUnitId: unitId, onExisting: "skip", createCategories: true, ...options },
});

describe("parseDecimal", () => {
  it.each([
    ["25,00", 25], ["1.234,56", 1234.56], ["R$ 59,90", 59.9], ["59.90", 59.9],
    ["1.234", 1234], ["1,234.56", 1234.56], [12.5, 12.5], ["", null], [null, null],
  ] as const)("lê %s", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it("rejeita texto que não é número", () => {
    expect(parseDecimal("abc")).toBeUndefined();
    expect(parseDecimal("12,3,4.5")).toBeUndefined();
  });
});

describe("parseStatus", () => {
  it("traduz os rótulos em português", () => {
    expect(parseStatus("Ativo")).toBe("ACTIVE");
    expect(parseStatus("inativo")).toBe("DISCONTINUED");
    expect(parseStatus("RASCUNHO")).toBe("DRAFT");
    expect(parseStatus("ARCHIVED")).toBe("ARCHIVED");
    expect(parseStatus("talvez")).toBeUndefined();
  });
});

describe("resolveColumns", () => {
  it("reconhece o modelo de planilha mais comum", () => {
    expect(resolveColumns(HEADER).map((column) => column.field)).toEqual([
      "sku", "name", "category", "subcategory", "brand", "standardCost", "salePrice", "status",
    ]);
  });

  it("ignora colunas desconhecidas e repetidas", () => {
    expect(resolveColumns(["Código", "SKU", "Cor"]).map((column) => column.field)).toEqual(["sku", null, null]);
  });
});

describe("PreviewProductImportUseCase", () => {
  it("planeja a criação dos produtos e das categorias que faltam", async () => {
    const { repo } = repository({ categories: { "/vestuario": true } });
    const report = await new PreviewProductImportUseCase(repo).execute(request(SAMPLE));
    expect(report.summary).toMatchObject({ total: 2, create: 2, error: 0 });
    expect(report.categoriesToCreate).toEqual(["Calçados", "Vestuário › Camisetas", "Calçados › Tênis"]);
    expect(report.rows[0]).toMatchObject({ line: 2, sku: "CAM-PT-M", category: "Vestuário › Camisetas", action: "create" });
  });

  it("aponta erros por linha sem interromper as demais", async () => {
    const { repo } = repository();
    const report = await new PreviewProductImportUseCase(repo).execute(request([
      HEADER,
      ["AB CD", "Produto", "", "", "", "10", "", "Ativo"],
      ["OK-1", "Produto", "", "Sub", "", "dez", "", "Ativo"],
      ["OK-2", "", "", "", "", "", "", "talvez"],
      ["OK-3", "Produto válido", "", "", "", "", "", ""],
      ["ok-3", "Duplicado", "", "", "", "", "", ""],
    ]));
    expect(report.rows.map((row) => row.action)).toEqual(["error", "error", "error", "create", "error"]);
    expect(report.rows[1]!.errors).toEqual(["Subcategoria informada sem categoria", 'Custo unitário: "dez" não é um número']);
    expect(report.rows[2]!.errors).toContain("Nome: obrigatório");
    expect(report.rows[4]!.errors).toEqual(["SKU repetido na planilha (linha 5)"]);
  });

  it("ignora, atualiza ou recusa SKUs existentes conforme a opção", async () => {
    const { repo } = repository({ skus: ["CAM-PT-M"], categories: { "/vestuario": true, "/vestuario/camisetas": true, "/calcados": true, "/calcados/tenis": true } });
    const preview = new PreviewProductImportUseCase(repo);
    expect((await preview.execute(request(SAMPLE))).rows[0]!.action).toBe("skip");
    expect((await preview.execute(request(SAMPLE, { onExisting: "update" }))).rows[0]!.action).toBe("update");
    expect((await preview.execute(request(SAMPLE, { onExisting: "error" }))).rows[0]!.errors).toEqual(["SKU já cadastrado"]);
  });

  it("recusa categorias inativas ou ausentes quando a criação está desligada", async () => {
    const { repo } = repository({ categories: { "/vestuario": false } });
    const report = await new PreviewProductImportUseCase(repo).execute(request(SAMPLE, { createCategories: false }));
    expect(report.rows[0]!.errors).toEqual(['Categoria "Vestuário" está inativa', 'Categoria "Camisetas" não cadastrada']);
  });

  it("usa a coluna de unidade quando existe e avisa margem negativa", async () => {
    const { repo } = repository();
    const report = await new PreviewProductImportUseCase(repo).execute(request([
      ["SKU", "Nome", "Unidade", "Custo", "Preço de venda"],
      ["ARROZ-5", "Arroz 5kg", "KG", "30", "25"],
      ["FEIJAO-1", "Feijão 1kg", "cx", "", ""],
    ]));
    expect(report.rows[0]).toMatchObject({ action: "create", warnings: ["Preço de venda abaixo do custo"] });
    expect(report.rows[1]!.errors).toEqual(['Unidade "cx" não cadastrada']);
  });
});

describe("CommitProductImportUseCase", () => {
  it("grava o plano com valores normalizados", async () => {
    const { repo, applied } = repository({ categories: { "/vestuario": true } });
    const report = await new CommitProductImportUseCase(repo).execute(request(SAMPLE), "actor");
    expect(report.committed).toBe(true);
    expect(applied[0]!.categories.map((category) => category.path)).toEqual(["/calcados", "/vestuario/camisetas", "/calcados/tenis"]);
    expect(applied[0]!.creates[0]).toMatchObject({
      sku: "CAM-PT-M", name: "Camiseta Preta M", brand: "Marca X", standardCost: 25, salePrice: 59.9,
      status: "ACTIVE", unit: "un", baseUnitId: unitId, categoryPath: "/vestuario/camisetas",
    });
  });

  it("não grava nada quando alguma linha tem erro", async () => {
    const { repo, applied } = repository();
    await expect(new CommitProductImportUseCase(repo).execute(request([...SAMPLE, ["X", "", "", "", "", "", "", ""]]), "actor"))
      .rejects.toMatchObject({ code: "IMPORT_HAS_ERRORS" });
    expect(applied).toHaveLength(0);
  });

  it("exige as colunas obrigatórias", async () => {
    const { repo } = repository();
    await expect(new CommitProductImportUseCase(repo).execute(request([["Nome"], ["Produto"]]), "actor"))
      .rejects.toMatchObject({ code: "IMPORT_MISSING_COLUMNS" });
  });
});
