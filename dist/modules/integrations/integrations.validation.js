"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShipmentSchema = exports.quoteSchema = void 0;
const zod_1 = require("zod");
exports.quoteSchema = {
    body: zod_1.z.object({
        weight: zod_1.z.coerce.number().positive(),
        from: zod_1.z.string().min(1),
        to: zod_1.z.string().min(1),
    }),
};
exports.createShipmentSchema = {
    body: zod_1.z.object({
        shipmentId: zod_1.z.string().uuid(),
    }),
};
