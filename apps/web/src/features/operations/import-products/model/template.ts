const TEMPLATE = [
  ["SKU (Código)", "Nome do Produto", "Categoria", "Subcategoria", "Marca/Fornecedor", "Custo Unitário", "Preço de Venda", "Status"],
  ["CAM-PT-M", "Camiseta Preta M", "Vestuário", "Camisetas", "Marca X", "25,00", "59,90", "Ativo"],
  ["TEN-BR-40", "Tênis Branco 40", "Calçados", "Tênis", "Marca Y", "120,00", "299,90", "Ativo"],
];

const quote = (value: string) => (/[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** CSV com `;` e BOM: abre com acentos e colunas certas no Excel em pt-BR. */
export function templateCsv(): string {
  return `﻿${TEMPLATE.map((row) => row.map(quote).join(";")).join("\r\n")}\r\n`;
}

export function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([templateCsv()], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-importacao-produtos.csv";
  link.click();
  URL.revokeObjectURL(url);
}
