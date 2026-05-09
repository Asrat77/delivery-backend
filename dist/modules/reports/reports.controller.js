"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverPerformance = exports.cod = exports.payments = exports.shipmentsByStatus = exports.summary = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const reportsService = __importStar(require("./reports.service"));
exports.summary = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await reportsService.summary();
    return res.status(200).json((0, response_1.successResponse)("Summary", data));
});
exports.shipmentsByStatus = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await reportsService.shipmentsByStatus();
    return res.status(200).json((0, response_1.successResponse)("Shipments by status", data));
});
exports.payments = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await reportsService.payments();
    return res.status(200).json((0, response_1.successResponse)("Payments report", data));
});
exports.cod = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await reportsService.cod();
    return res.status(200).json((0, response_1.successResponse)("COD report", data));
});
exports.driverPerformance = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await reportsService.driverPerformance();
    return res.status(200).json((0, response_1.successResponse)("Driver performance", data));
});
