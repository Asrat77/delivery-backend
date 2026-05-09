"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValidTransition = assertValidTransition;
const ApiError_1 = require("../../utils/ApiError");
const transitions = {
    CREATED: ["PICKED_UP", "CANCELLED"],
    PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["OUT_FOR_DELIVERY", "CANCELLED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
};
function assertValidTransition(from, to) {
    if (!transitions[from].includes(to)) {
        throw new ApiError_1.ApiError(400, `Invalid status transition: ${from} -> ${to}`);
    }
}
