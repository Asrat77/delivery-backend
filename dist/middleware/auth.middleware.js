"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
async function authMiddleware(req, _res, next) {
    const header = req.header("authorization") || req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
        return next(new ApiError_1.ApiError(401, "Unauthorized"));
    }
    const token = header.slice("Bearer ".length).trim();
    const env = (0, env_1.getEnv)();
    try {
        const payload = jsonwebtoken_1.default.verify(token, env.JWT_SECRET);
        const userId = payload.sub ?? payload.userId;
        if (!userId || !payload.role)
            return next(new ApiError_1.ApiError(401, "Unauthorized"));
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true, phone: true } });
        if (!user)
            return next(new ApiError_1.ApiError(401, "Unauthorized"));
        if (user.status !== "ACTIVE")
            return next(new ApiError_1.ApiError(403, "User is inactive"));
        req.user = { id: user.id, role: user.role, phone: user.phone };
        return next();
    }
    catch {
        return next(new ApiError_1.ApiError(401, "Unauthorized"));
    }
}
