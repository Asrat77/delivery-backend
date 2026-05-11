"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markCollectedSchema = exports.listCodSchema = exports.shipmentIdParamsSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../utils/pagination");
exports.shipmentIdParamsSchema = {
    params: zod_1.z.object({ shipmentId: zod_1.z.string().uuid() }),
};
exports.listCodSchema = {
    query: pagination_1.paginationQuerySchema.extend({
        status: zod_1.z.enum(["PENDING", "COLLECTED"]).optional(),
        driverId: zod_1.z.string().uuid().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
    }),
};
exports.markCollectedSchema = {
    params: exports.shipmentIdParamsSchema.params,
    body: zod_1.z.object({}).optional(),
};
