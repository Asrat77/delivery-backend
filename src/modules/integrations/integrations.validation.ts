import { z } from "zod";

export const quoteSchema = {
  body: z.object({
    weight: z.coerce.number().positive(),
    from: z.string().min(1),
    to: z.string().min(1),
  }),
};

export const createShipmentSchema = {
  body: z.object({
    shipmentId: z.string().uuid(),
  }),
};

