"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
const response_1 = require("../utils/response");
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(422).json((0, response_1.errorResponse)("Validation Error", 422, err.flatten()));
    }
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json((0, response_1.errorResponse)(err.message, err.statusCode, err.details));
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json((0, response_1.errorResponse)("Internal Server Error", 500, null));
}
