import type { ImportCell } from "@/entities/product";
import { decodeText, parseCsv, trimSheet } from "./parse-csv";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILES = ".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const toCell = (value: unknown): ImportCell => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
};

/** Lê a primeira aba do XLSX ou o CSV e devolve as células, com o cabeçalho na primeira linha. */
export async function readSpreadsheet(file: File): Promise<ImportCell[][]> {
  if (file.size > MAX_FILE_BYTES) throw new Error("O arquivo passa de 10 MB. Divida a planilha em partes menores.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".xls")) throw new Error("O formato .xls (Excel 97-2003) não é suportado. Salve como .xlsx ou .csv.");
  if (name.endsWith(".xlsx")) {
    // Carregado sob demanda: só quem importa XLSX baixa o leitor.
    const { readSheet } = await import("read-excel-file/browser");
    try {
      const rows = await readSheet(file);
      return trimSheet(rows.map((row) => row.map(toCell)));
    } catch {
      throw new Error("Não foi possível ler a planilha. Confira se o arquivo é um .xlsx válido.");
    }
  }
  return parseCsv(decodeText(await file.arrayBuffer()));
}
