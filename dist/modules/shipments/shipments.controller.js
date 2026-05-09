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
exports.verifyOtp = exports.qr = exports.updateStatus = exports.assignDriver = exports.getById = exports.list = exports.create = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const shipmentsService = __importStar(require("./shipments.service"));
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await shipmentsService.createShipment({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        data: req.body,
    });
    return res.status(201).json((0, response_1.successResponse)("Shipment created", data));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await shipmentsService.listShipments({ userId: req.user.id, userPhone: req.user.phone, role: req.user.role, query: req.query });
    return res.status(200).json((0, response_1.successResponse)("Shipments", data));
});
exports.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shipment = await shipmentsService.getShipmentById({
        shipmentId: String(req.params.id),
        userId: req.user.id,
        userPhone: req.user.phone,
        role: req.user.role,
    });
    return res.status(200).json((0, response_1.successResponse)("Shipment", shipment));
});
exports.assignDriver = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shipment = await shipmentsService.assignDriver({
        shipmentId: String(req.params.id),
        driverId: req.body.driverId,
        assignedById: req.user.id,
    });
    return res.status(200).json((0, response_1.successResponse)("Driver assigned", shipment));
});
exports.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const shipment = await shipmentsService.updateShipmentStatus({
        shipmentId: String(req.params.id),
        status: req.body.status,
        actorUserId: req.user.id,
        actorRole: req.user.role,
    });
    return res.status(200).json((0, response_1.successResponse)("Shipment status updated", shipment));
});
exports.qr = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dataUrl = await shipmentsService.getShipmentQrDataUrl(String(req.params.id));
    return res.status(200).json((0, response_1.successResponse)("QR code", { dataUrl }));
});
exports.verifyOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const proof = await shipmentsService.verifyShipmentOtp({ shipmentId: String(req.params.id), otp: req.body.otp });
    return res.status(200).json((0, response_1.successResponse)("OTP verified", {
        id: proof.id,
        verified: proof.verified,
        verifiedAt: proof.verifiedAt,
    }));
});
