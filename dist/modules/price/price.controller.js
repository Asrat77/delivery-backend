"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const price_service_1 = require("./price.service");
exports.calculate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, price_service_1.calculatePrice)(req.body);
    return res.status(200).json((0, response_1.successResponse)("Price calculated", result));
});
