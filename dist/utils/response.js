"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(message, data) {
    return { success: true, message, data };
}
function errorResponse(message, statusCode, details = null) {
    return { success: false, message, statusCode, details };
}
