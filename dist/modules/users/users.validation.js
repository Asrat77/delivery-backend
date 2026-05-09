"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleSchema = exports.updateUserStatusSchema = exports.userIdParamsSchema = exports.listUsersSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../utils/pagination");
exports.createUserSchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().min(6),
        password: zod_1.z.string().min(8),
        role: zod_1.z.enum(["ADMIN", "STAFF", "DRIVER", "CUSTOMER"]),
        status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
    }),
};
exports.listUsersSchema = {
    query: pagination_1.paginationQuerySchema.extend({
        role: zod_1.z.enum(["ADMIN", "STAFF", "DRIVER", "CUSTOMER"]).optional(),
        status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
    }),
};
exports.userIdParamsSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
};
exports.updateUserStatusSchema = {
    params: exports.userIdParamsSchema.params,
    body: zod_1.z.object({
        status: zod_1.z.enum(["ACTIVE", "INACTIVE"]),
    }),
};
exports.updateUserRoleSchema = {
    params: exports.userIdParamsSchema.params,
    body: zod_1.z.object({
        role: zod_1.z.enum(["ADMIN", "STAFF", "DRIVER", "CUSTOMER"]),
    }),
};
