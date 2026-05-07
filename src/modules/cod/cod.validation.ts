import { z } from "zod";

export const shipmentIdParamsSchema = {
  params: z.object({ shipmentId: z.string().uuid() }),
};

export const markCollectedSchema = {
  params: shipmentIdParamsSchema.params,
  body: z.object({}).optional(),
};

