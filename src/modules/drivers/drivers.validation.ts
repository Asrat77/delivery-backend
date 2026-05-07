import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const listDriversSchema = {
  query: paginationQuerySchema.extend({
    isAvailable: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
};

export const driverIdParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

