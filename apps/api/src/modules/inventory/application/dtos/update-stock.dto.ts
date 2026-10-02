export type StockMovementType = "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "RETURN";

export type UpdateStockDto = {
  stockLevelId: string;
  type: StockMovementType;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  actorId: string;
  correlationId?: string;
};
