"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePriceSchema = void 0;
const zod_1 = require("zod");
exports.calculatePriceSchema = {
    body: zod_1.z.object({
        deliveryType: zod_1.z.enum(["BICYCLE", "MOTORBIKE"]),
        pickupLat: zod_1.z.coerce.number().min(-90).max(90),
        pickupLng: zod_1.z.coerce.number().min(-180).max(180),
        deliveryLat: zod_1.z.coerce.number().min(-90).max(90),
        deliveryLng: zod_1.z.coerce.number().min(-180).max(180),
        serviceType: zod_1.z.enum(["DOMESTIC", "INTERNATIONAL"]).default("DOMESTIC"),
    }),
};
