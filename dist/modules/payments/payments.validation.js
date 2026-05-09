"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markPaidSchema = exports.shipmentIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.shipmentIdParamsSchema = {
    params: zod_1.z.object({ shipmentId: zod_1.z.string().uuid() }),
};
exports.markPaidSchema = {
    params: exports.shipmentIdParamsSchema.params,
    body: zod_1.z.object({
        providerReference: zod_1.z.string().min(1).optional(),
    }),
};
