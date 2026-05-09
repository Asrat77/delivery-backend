"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = void 0;
exports.toPagination = toPagination;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
function toPagination(query) {
    const page = query.page;
    const limit = query.limit;
    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
}
