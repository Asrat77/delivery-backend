"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = exports.updateShipmentStatusSchema = exports.assignDriverSchema = exports.listShipmentsSchema = exports.createShipmentSchema = exports.shipmentIdParamsSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../utils/pagination");
exports.shipmentIdParamsSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
};
exports.createShipmentSchema = {
    body: zod_1.z.object({
        senderName: zod_1.z.string().min(1),
        senderPhone: zod_1.z.string().min(6),
        receiverName: zod_1.z.string().min(1),
        receiverPhone: zod_1.z.string().min(6),
        pickupAddress: zod_1.z.string().min(1),
        deliveryAddress: zod_1.z.string().min(1),
        pickupLat: zod_1.z.coerce.number().min(-90).max(90).optional(),
        pickupLng: zod_1.z.coerce.number().min(-180).max(180).optional(),
        deliveryLat: zod_1.z.coerce.number().min(-90).max(90).optional(),
        deliveryLng: zod_1.z.coerce.number().min(-180).max(180).optional(),
        packageType: zod_1.z.string().min(1),
        weight: zod_1.z.coerce.number().positive(),
        price: zod_1.z.coerce.number().positive().optional(),
        serviceType: zod_1.z.enum(["DOMESTIC", "INTERNATIONAL"]).default("DOMESTIC"),
        deliveryType: zod_1.z.enum(["BICYCLE", "MOTORBIKE", "FOOT"]),
        paymentMethod: zod_1.z.enum(["TELEBIRR", "CBE_BIRR", "CASH"]).default("CASH"),
        codAmount: zod_1.z.coerce.number().positive().optional(),
    }),
};
exports.listShipmentsSchema = {
    query: pagination_1.paginationQuerySchema.extend({
        status: zod_1.z.enum(["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]).optional(),
        assignedDriverId: zod_1.z.string().uuid().optional(),
        trackingNumber: zod_1.z.string().min(3).optional(),
        senderPhone: zod_1.z.string().min(3).optional(),
        receiverPhone: zod_1.z.string().min(3).optional(),
        serviceType: zod_1.z.enum(["DOMESTIC", "INTERNATIONAL"]).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
    }),
};
exports.assignDriverSchema = {
    params: exports.shipmentIdParamsSchema.params,
    body: zod_1.z.object({
        driverId: zod_1.z.string().uuid(),
    }),
};
exports.updateShipmentStatusSchema = {
    params: exports.shipmentIdParamsSchema.params,
    body: zod_1.z.object({
        status: zod_1.z.enum(["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
    }),
};
exports.verifyOtpSchema = {
    params: exports.shipmentIdParamsSchema.params,
    body: zod_1.z.object({
        otp: zod_1.z.string().regex(/^\d{5}$/),
    }),
};
