import z from "zod";

export const paginationQuerySchema = z.compile(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
);

export const searchQuerySchema = z.compile(
  z.object({
    q: z.string().trim().optional().default(""),
  }),
);

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
