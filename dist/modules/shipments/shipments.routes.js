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
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const shipmentsController = __importStar(require("./shipments.controller"));
const shipments_validation_1 = require("./shipments.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post("/", (0, role_middleware_1.requireRole)("ADMIN", "STAFF", "CUSTOMER"), (0, validate_middleware_1.validate)(shipments_validation_1.createShipmentSchema), shipmentsController.create);
router.get("/", (0, validate_middleware_1.validate)(shipments_validation_1.listShipmentsSchema), shipmentsController.list);
router.get("/:id", (0, validate_middleware_1.validate)(shipments_validation_1.shipmentIdParamsSchema), shipmentsController.getById);
router.patch("/:id/assign-driver", (0, role_middleware_1.requireRole)("ADMIN", "STAFF"), (0, validate_middleware_1.validate)(shipments_validation_1.assignDriverSchema), shipmentsController.assignDriver);
router.patch("/:id/status", (0, role_middleware_1.requireRole)("ADMIN", "STAFF"), (0, validate_middleware_1.validate)(shipments_validation_1.updateShipmentStatusSchema), shipmentsController.updateStatus);
router.get("/:id/qr", (0, validate_middleware_1.validate)(shipments_validation_1.shipmentIdParamsSchema), shipmentsController.qr);
router.post("/:id/verify-otp", (0, validate_middleware_1.validate)(shipments_validation_1.verifyOtpSchema), shipmentsController.verifyOtp);
exports.default = router;
