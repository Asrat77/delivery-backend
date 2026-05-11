"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePricingStatusSchema = exports.updatePricingSchema = exports.listPricingSchema = exports.createPricingSchema = exports.pricingIdParamsSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../utils/pagination");
exports.pricingIdParamsSchema = {
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
};
exports.createPricingSchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        type: zod_1.z.enum(["FIXED", "PER_KG"]),
        deliveryType: zod_1.z.enum(["BICYCLE", "MOTORBIKE", "FOOT"]),
        baseFare: zod_1.z.coerce.number().positive().optional(),
        ratePerKm: zod_1.z.coerce.number().positive().optional(),
        packageType: zod_1.z.string().min(1).optional(),
        fixedPrice: zod_1.z.coerce.number().positive().optional(),
        pricePerKg: zod_1.z.coerce.number().positive().optional(),
        minWeight: zod_1.z.coerce.number().positive().optional(),
        maxWeight: zod_1.z.coerce.number().positive().optional(),
        isActive: zod_1.z.boolean().default(true),
    }),
};
exports.listPricingSchema = {
    query: pagination_1.paginationQuerySchema.extend({
        isActive: zod_1.z
            .string()
            .optional()
            .transform((v) => (v === undefined ? undefined : v === "true")),
    }),
};
exports.updatePricingSchema = {
    params: exports.pricingIdParamsSchema.params,
    body: exports.createPricingSchema.body.partial(),
};
exports.updatePricingStatusSchema = {
    params: exports.pricingIdParamsSchema.params,
    body: zod_1.z.object({
        isActive: zod_1.z.boolean(),
    }),
};
