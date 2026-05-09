"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const ApiError_1 = require("../utils/ApiError");
function requireRole(...roles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user)
            return next(new ApiError_1.ApiError(401, "Unauthorized"));
        if (!roles.includes(user.role))
            return next(new ApiError_1.ApiError(403, "Forbidden"));
        return next();
    };
}
