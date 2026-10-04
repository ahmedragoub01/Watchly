import type { Paginated } from '@watchly/shared';

export function parsePagination(
  query: Record<string, unknown> | undefined,
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): { page: number; limit: number; offset: number } {
  const { defaultLimit = 20, maxLimit = 50 } = opts;
  const rawPage = Number.parseInt(String(query?.page ?? '1'), 10);
  const rawLimit = Number.parseInt(String(query?.limit ?? defaultLimit), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(maxLimit, Math.max(1, rawLimit)) : defaultLimit;
  return { page, limit, offset: (page - 1) * limit };
}

export function paginatedResult<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return { items, page, limit, total, hasMore: page * limit < total };
}