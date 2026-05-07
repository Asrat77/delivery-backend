import { z } from "zod";

export const updateLocationSchema = {
  body: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
};

export const updateShipmentStatusSchema = {
  params: z.object({
    shipmentId: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"]),
    locationText: z.string().min(1).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  }),
};

