/**
 * Anticorruption layer sobre o contexto `inventory`: o contexto de transação só
 * precisa saber o que existe e quanto está disponível, não como o saldo é mantido.
 */
export interface StockAvailability {
  stockLevelId: string;
  productId: string;
  warehouseId: string;
  sku: string;
  available: number;
  isSellable: boolean;
}

export interface StockAvailabilityPort {
  find(stockLevelId: string): Promise<StockAvailability | null>;
}
