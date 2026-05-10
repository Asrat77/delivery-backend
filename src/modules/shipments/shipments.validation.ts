import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const shipmentIdParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const createShipmentSchema = {
  body: z.object({
    senderName: z.string().min(1),
    senderPhone: z.string().min(6),
    receiverName: z.string().min(1),
    receiverPhone: z.string().min(6),
    pickupAddress: z.string().min(1),
    deliveryAddress: z.string().min(1),
    pickupLat: z.coerce.number().min(-90).max(90),
    pickupLng: z.coerce.number().min(-180).max(180),
    deliveryLat: z.coerce.number().min(-90).max(90),
    deliveryLng: z.coerce.number().min(-180).max(180),
    packageType: z.string().min(1),
    weight: z.coerce.number().positive(),
    price: z.coerce.number().positive().optional(),
    serviceType: z.enum(["DOMESTIC", "INTERNATIONAL"]).default("DOMESTIC"),
    deliveryType: z.enum(["BICYCLE", "MOTORBIKE", "FOOT"]),
    paymentMethod: z.enum(["TELEBIRR", "CBE_BIRR", "CASH"]).default("CASH"),
    codAmount: z.coerce.number().positive().optional(),
  }),
};

export const listShipmentsSchema = {
  query: paginationQuerySchema.extend({
    status: z.enum(["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]).optional(),
    assignedDriverId: z.string().uuid().optional(),
    trackingNumber: z.string().min(3).optional(),
    senderPhone: z.string().min(3).optional(),
    receiverPhone: z.string().min(3).optional(),
    serviceType: z.enum(["DOMESTIC", "INTERNATIONAL"]).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
};

export const assignDriverSchema = {
  params: shipmentIdParamsSchema.params,
  body: z.object({
    driverId: z.string().uuid(),
  }),
};

export const updateShipmentStatusSchema = {
  params: shipmentIdParamsSchema.params,
  body: z.object({
    status: z.enum(["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  }),
};

export const verifyOtpSchema = {
  params: shipmentIdParamsSchema.params,
  body: z.object({
    otp: z.string().regex(/^\d{5}$/),
  }),
};

