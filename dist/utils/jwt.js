"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const ApiError_1 = require("./ApiError");
/**
 * Verify a JWT token and return the authenticated user.
 * Reusable across REST middleware and Socket.IO auth.
 */
async function verifyToken(token) {
    const env = (0, env_1.getEnv)();
    const payload = jsonwebtoken_1.default.verify(token, env.JWT_SECRET);
    const userId = payload.sub ?? payload.userId;
    if (!userId || !payload.role) {
        throw new ApiError_1.ApiError(401, "Unauthorized");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true, phone: true },
    });
    if (!user)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    if (user.status !== "ACTIVE")
        throw new ApiError_1.ApiError(403, "User is inactive");
    return { id: user.id, role: user.role, phone: user.phone ?? undefined };
}
