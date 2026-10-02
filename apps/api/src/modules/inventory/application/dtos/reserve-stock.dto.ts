export type ReserveStockDto = {
  stockLevelId: string;
  quantity: number;
  transactionId?: string;
  expiresAt?: Date;
  actorId: string;
  correlationId?: string;
};

export type ReleaseStockDto = {
  reservationId: string;
  actorId: string;
  correlationId?: string;
};
