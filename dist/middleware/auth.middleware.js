"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
const ApiError_1 = require("../utils/ApiError");
async function authMiddleware(req, _res, next) {
    const header = req.header("authorization") || req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
        return next(new ApiError_1.ApiError(401, "Unauthorized"));
    }
    const token = header.slice("Bearer ".length).trim();
    try {
        req.user = await (0, jwt_1.verifyToken)(token);
        return next();
    }
    catch {
        return next(new ApiError_1.ApiError(401, "Unauthorized"));
    }
}
