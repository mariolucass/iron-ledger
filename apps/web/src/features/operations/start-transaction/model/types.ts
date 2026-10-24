/** Saldo selecionável; a página fornece os rótulos a partir do inventário. */
export interface TransactionStockOption {
  stockLevelId: string;
  sku: string;
  product: string;
  warehouse: string;
  available: number;
}
