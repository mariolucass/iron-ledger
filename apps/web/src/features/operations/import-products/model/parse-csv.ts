import Papa from "papaparse";
import type { ImportCell } from "@/entities/product";

/**
 * Excel em pt-BR salva CSV em Windows-1252 ("Tênis" vira "T\xEAnis").
 * Tenta UTF-8 estrito e, se falhar, cai para Windows-1252.
 */
export function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/** Remove linhas vazias do fim e colunas vazias à direita do cabeçalho. */
export function trimSheet(rows: ImportCell[][]): ImportCell[][] {
  const blank = (value: ImportCell) => value === null || (typeof value === "string" && value.trim() === "");
  const filled = rows.filter((row) => !row.every(blank));
  const header = filled[0] ?? [];
  let width = header.length;
  while (width > 0 && blank(header[width - 1] ?? null)) width -= 1;
  return filled.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? null));
}

/** O delimitador é detectado: `;` (Excel pt-BR), `,`, tabulação ou `|`. */
export function parseCsv(text: string): ImportCell[][] {
  const result = Papa.parse<string[]>(text, {
    delimitersToGuess: [";", ",", "\t", "|"],
    skipEmptyLines: "greedy",
  });
  const fatal = result.errors.find((error) => error.type === "Quotes");
  if (fatal) throw new Error(`Aspas sem fechamento na linha ${(fatal.row ?? 0) + 1} do CSV.`);
  return trimSheet(result.data.map((row) => row.map((value) => value.trim() || null)));
}
