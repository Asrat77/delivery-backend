"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverIdParamsSchema = exports.listDriversSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../utils/pagination");
exports.listDriversSchema = {
    query: pagination_1.paginationQuerySchema.extend({
        isAvailable: zod_1.z
            .string()
            .optional()
            .transform((v) => (v === undefined ? undefined : v === "true")),
    }),
};
exports.driverIdParamsSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
};
