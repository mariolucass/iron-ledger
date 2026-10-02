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
