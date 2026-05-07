import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function toPagination(query: { page: number; limit: number }) {
  const page = query.page;
  const limit = query.limit;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

