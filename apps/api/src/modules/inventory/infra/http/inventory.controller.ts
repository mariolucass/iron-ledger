import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import { CORRELATION_HEADER } from "../../../../infra/http/middlewares/request-logger.middleware";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import type { CommitReservationUseCase } from "../../application/use-cases/commit-reservation.use-case";
import type { QueryInventoryUseCase } from "../../application/use-cases/query-inventory.use-case";
import type { ReleaseStockUseCase } from "../../application/use-cases/release-stock.use-case";
import type { ReserveStockUseCase } from "../../application/use-cases/reserve-stock.use-case";
import type { UpdateStockUseCase } from "../../application/use-cases/update-stock.use-case";
import { STOCK_MOVEMENT_TYPES } from "../../domain/entities/stock-movement.entity";
import type { MutationContext } from "../../domain/repositories/inventory.repository";

const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
const listSchema = pageSchema.extend({
  sku: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  warehouseId: z.string().uuid().optional(),
});
const movementSchema = z.object({
  stockLevelId: z.string().uuid(),
  type: z.enum(STOCK_MOVEMENT_TYPES),
  quantity: z
    .number()
    .finite()
    .refine((value) => value !== 0, "A quantidade deve ser diferente de zero."),
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
const transactionParamsSchema = z.object({ transactionId: z.string().uuid() });

/** Autor da mutação e correlation ID (garantido pelo `requestLogger`). */
const mutationContext = (request: AuthenticatedRequest): MutationContext => ({
  actorId: request.auth!.userId,
  correlationId: request.header(CORRELATION_HEADER),
});

export class InventoryController {
  constructor(
    private readonly queries: QueryInventoryUseCase,
    private readonly updateStock: UpdateStockUseCase,
    private readonly reserveStock: ReserveStockUseCase,
    private readonly releaseStock: ReleaseStockUseCase,
    private readonly commitReservation: CommitReservationUseCase,
  ) {}

  list = handle(200, (request) => this.queries.list(listSchema.parse(request.query)));
  warehouses = handle(200, () => this.queries.warehouses());
  movements = handle(200, (request) => {
    const { stockLevelId } = movementParamsSchema.parse(request.params);
    const { page, pageSize } = pageSchema.parse(request.query);
    return this.queries.movements(stockLevelId, page, pageSize);
  });
  reservationByTransaction = handle(200, (request) =>
    this.queries.reservationByTransaction(
      transactionParamsSchema.parse(request.params).transactionId,
    ),
  );
  createMovement = handle(201, (request) =>
    this.updateStock.execute({
      ...movementSchema.parse(request.body),
      ...mutationContext(request),
    }),
  );
  createReservation = handle(201, (request) =>
    this.reserveStock.execute({
      ...reservationSchema.parse(request.body),
      ...mutationContext(request),
    }),
  );
  releaseReservation = handle(200, (request) =>
    this.releaseStock.execute({
      reservationId: idSchema.parse(request.params).id,
      ...mutationContext(request),
    }),
  );
  commit = handle(200, (request) =>
    this.commitReservation.execute({
      reservationId: idSchema.parse(request.params).id,
      ...mutationContext(request),
    }),
  );
}
