import { z } from "zod";

export type PaginationInput = { page: number; pageSize: number };

export function pagination(page = 1, pageSize = 20, maximumPageSize = 100) {
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.min(maximumPageSize, Math.max(1, Math.trunc(pageSize)));
  return {
    page: safePage,
    pageSize: safePageSize,
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}

/** Campos `page`/`pageSize` das listagens na query string. */
export const pageQueryShape = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
};

export const pageQuerySchema = z.object(pageQueryShape);
