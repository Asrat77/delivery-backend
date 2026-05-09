import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const pricingIdParamsSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const createPricingSchema = {
  body: z.object({
    name: z.string().min(1),
    type: z.enum(["FIXED", "PER_KG"]),
    deliveryType: z.enum(["BICYCLE", "MOTORBIKE"]),
    baseFare: z.coerce.number().positive().optional(),
    ratePerKm: z.coerce.number().positive().optional(),
    packageType: z.string().min(1).optional(),
    fixedPrice: z.coerce.number().positive().optional(),
    pricePerKg: z.coerce.number().positive().optional(),
    minWeight: z.coerce.number().positive().optional(),
    maxWeight: z.coerce.number().positive().optional(),
    isActive: z.boolean().default(true),
  }),
};

export const listPricingSchema = {
  query: paginationQuerySchema.extend({
    isActive: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
};

export const updatePricingSchema = {
  params: pricingIdParamsSchema.params,
  body: createPricingSchema.body.partial(),
};

export const updatePricingStatusSchema = {
  params: pricingIdParamsSchema.params,
  body: z.object({
    isActive: z.boolean(),
  }),
};

