"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShipmentStatusSchema = exports.updateLocationSchema = void 0;
const zod_1 = require("zod");
exports.updateLocationSchema = {
    body: zod_1.z.object({
        lat: zod_1.z.coerce.number().min(-90).max(90),
        lng: zod_1.z.coerce.number().min(-180).max(180),
    }),
};
exports.updateShipmentStatusSchema = {
    params: zod_1.z.object({
        shipmentId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"]),
        locationText: zod_1.z.string().min(1).optional(),
        lat: zod_1.z.coerce.number().min(-90).max(90).optional(),
        lng: zod_1.z.coerce.number().min(-180).max(180).optional(),
    }),
};
