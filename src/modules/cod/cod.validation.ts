import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const shipmentIdParamsSchema = {
  params: z.object({ shipmentId: z.string().uuid() }),
};

export const listCodSchema = {
  query: paginationQuerySchema.extend({
    status: z.enum(["PENDING", "COLLECTED"]).optional(),
    driverId: z.string().uuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
};

export const markCollectedSchema = {
  params: shipmentIdParamsSchema.params,
  body: z.object({}).optional(),
};

