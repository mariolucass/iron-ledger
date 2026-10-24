import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { productApi } from "../src/entities/product/api/product-api";
import { decodeText, parseCsv, trimSheet } from "../src/features/operations/import-products/model/parse-csv";
import { templateCsv } from "../src/features/operations/import-products/model/template";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("CSV do Excel pt-BR: ponto e vírgula, aspas e decimal com vírgula", () => {
  const rows = parseCsv('SKU;Nome;Custo\r\nCAM-1;"Camiseta; básica";25,00\r\n\r\n');
  assert.deepEqual(rows, [["SKU", "Nome", "Custo"], ["CAM-1", "Camiseta; básica", "25,00"]]);
});

test("CSV separado por vírgula também é reconhecido", () => {
  assert.deepEqual(parseCsv("SKU,Nome\nA-1,Produto\n"), [["SKU", "Nome"], ["A-1", "Produto"]]);
});

test("Windows-1252 é decodificado quando o arquivo não é UTF-8", () => {
  const latin1 = new Uint8Array([0x54, 0xea, 0x6e, 0x69, 0x73]); // "Tênis"
  assert.equal(decodeText(latin1.buffer), "Tênis");
  assert.equal(decodeText(new TextEncoder().encode("﻿Tênis").buffer as ArrayBuffer), "Tênis");
});

test("linhas vazias e colunas vazias à direita do cabeçalho são descartadas", () => {
  assert.deepEqual(trimSheet([["SKU", "Nome", null], ["A", "B", "lixo"], [null, "", null]]), [["SKU", "Nome"], ["A", "B"]]);
});

test("o modelo para download volta igual pela leitura", () => {
  const rows = parseCsv(decodeText(new TextEncoder().encode(templateCsv()).buffer as ArrayBuffer));
  assert.equal(rows.length, 3);
  assert.equal(rows[0]![0], "SKU (Código)");
  assert.deepEqual(rows[1], ["CAM-PT-M", "Camiseta Preta M", "Vestuário", "Camisetas", "Marca X", "25,00", "59,90", "Ativo"]);
});

test("prévia e confirmação usam os endpoints do BFF", async () => {
  const calls: Array<{ path: string; init: RequestInit }> = [];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ path: String(input), init });
    return Response.json({ rows: [], summary: { total: 0 } });
  };
  const body = { rows: [["SKU"], ["A"]], options: { defaultUnitId: "u", onExisting: "skip" as const, createCategories: true } };
  await productApi.previewImport(body);
  await productApi.commitImport(body);
  assert.deepEqual(calls.map((call) => [call.path, call.init.method]), [
    ["/api/products/imports/preview", "POST"],
    ["/api/products/imports/commit", "POST"],
  ]);
  assert.deepEqual(JSON.parse(String(calls[0]!.init.body)), body);
});
