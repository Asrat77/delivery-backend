import { z } from "zod";

export const shipmentIdParamsSchema = {
  params: z.object({ shipmentId: z.string().uuid() }),
};

export const markPaidSchema = {
  params: shipmentIdParamsSchema.params,
  body: z.object({
    providerReference: z.string().min(1).optional(),
  }),
};

