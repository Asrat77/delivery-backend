import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const listActivitySchema = {
  query: paginationQuerySchema.extend({
    serviceType: z.enum(["CITY", "DOMESTIC", "INTERNATIONAL"]).optional(),
  }),
};

export const activityIdParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};
