import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import type { ReleaseStockUseCase } from "../../application/use-cases/release-stock.use-case";
import type { CommitReservationUseCase } from "../../application/use-cases/commit-reservation.use-case";
import type { ReserveStockUseCase } from "../../application/use-cases/reserve-stock.use-case";
import type { UpdateStockUseCase } from "../../application/use-cases/update-stock.use-case";
import type { InventoryRepository } from "../../domain/repositories/inventory.repository";

const listSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  warehouseId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
const movementSchema = z.object({
  stockLevelId: z.string().uuid(),
  type: z.enum(["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"]),
  quantity: z.number().finite().refine((value) => value !== 0, "A quantidade deve ser diferente de zero."),
  referenceId: z.string().trim().max(120).optional(),
  referenceType: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});
const reservationSchema = z.object({
  stockLevelId: z.string().uuid(),
  quantity: z.number().positive(),
  transactionId: z.string().uuid().optional(),
  expiresAt: z.coerce.date().optional(),
});
const idSchema = z.object({ id: z.string().uuid() });
const movementParamsSchema = z.object({ stockLevelId: z.string().uuid() });

export class InventoryController {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly updateStock: UpdateStockUseCase,
    private readonly reserveStock: ReserveStockUseCase,
    private readonly releaseStock: ReleaseStockUseCase,
    private readonly commitReservation: CommitReservationUseCase,
  ) {}

  list = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      response.json(await this.inventory.list(listSchema.parse(request.query)));
    } catch (error) { next(error); }
  };

  warehouses = async (_request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      response.json({ items: await this.inventory.listWarehouses() });
    } catch (error) { next(error); }
  };

  movements = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { stockLevelId } = movementParamsSchema.parse(request.params);
      const { page, pageSize } = listSchema.pick({ page: true, pageSize: true }).parse(request.query);
      response.json(await this.inventory.listMovements(stockLevelId, page, pageSize));
    } catch (error) { next(error); }
  };

  createMovement = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const input = movementSchema.parse(request.body);
      const correlationId = this.correlationId(request, response);
      const movement = await this.updateStock.execute({ ...input, actorId: request.auth!.userId, correlationId });
      response.status(201).json(movement);
    } catch (error) { next(error); }
  };

  createReservation = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const input = reservationSchema.parse(request.body);
      const correlationId = this.correlationId(request, response);
      const reservation = await this.reserveStock.execute({ ...input, actorId: request.auth!.userId, correlationId });
      response.status(201).json(reservation);
    } catch (error) { next(error); }
  };

  releaseReservation = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { id } = idSchema.parse(request.params);
      const correlationId = this.correlationId(request, response);
      response.json(await this.releaseStock.execute({ reservationId: id, actorId: request.auth!.userId, correlationId }));
    } catch (error) { next(error); }
  };

  commit = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { id } = idSchema.parse(request.params);
      const correlationId = this.correlationId(request, response);
      response.json(await this.commitReservation.execute({ reservationId: id, actorId: request.auth!.userId, correlationId }));
    } catch (error) { next(error); }
  };

  private correlationId(request: AuthenticatedRequest, response: Response): string {
    const supplied = request.header("x-correlation-id")?.trim();
    const correlationId = supplied && supplied.length <= 120 ? supplied : randomUUID();
    response.setHeader("x-correlation-id", correlationId);
    return correlationId;
  }
}
