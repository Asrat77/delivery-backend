"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityIdParamsSchema = exports.listActivitySchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../utils/pagination");
exports.listActivitySchema = {
    query: pagination_1.paginationQuerySchema.extend({
        serviceType: zod_1.z.enum(["CITY", "DOMESTIC", "INTERNATIONAL"]).optional(),
    }),
};
exports.activityIdParamsSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
};
