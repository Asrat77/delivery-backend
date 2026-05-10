import { z } from "zod";

export const calculatePriceSchema = {
  body: z.object({
    deliveryType: z.enum(["BICYCLE", "MOTORBIKE", "FOOT"]),
    pickupLat: z.coerce.number().min(-90).max(90),
    pickupLng: z.coerce.number().min(-180).max(180),
    deliveryLat: z.coerce.number().min(-90).max(90),
    deliveryLng: z.coerce.number().min(-180).max(180),
    serviceType: z.enum(["CITY", "DOMESTIC", "INTERNATIONAL"]).default("CITY"),
  }),
};