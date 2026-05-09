"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyLoginSchema = exports.loginSchema = exports.verifyRegistrationSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().min(6),
        password: zod_1.z.string().min(8).optional(),
    }),
};
exports.verifyRegistrationSchema = {
    body: zod_1.z.object({
        phone: zod_1.z.string().min(6),
        otp: zod_1.z.string().length(5),
    }),
};
exports.loginSchema = {
    body: zod_1.z.object({
        emailOrPhone: zod_1.z.string().min(3),
        password: zod_1.z.string().min(1).optional(),
    }),
};
exports.verifyLoginSchema = {
    body: zod_1.z.object({
        phone: zod_1.z.string().min(6),
        otp: zod_1.z.string().length(5),
    }),
};
