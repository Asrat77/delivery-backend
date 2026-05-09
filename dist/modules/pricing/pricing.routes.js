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
const pricingController = __importStar(require("./pricing.controller"));
const priceCalculationController = __importStar(require("./price-calculation.controller"));
const pricing_validation_1 = require("./pricing.validation");
const price_calculation_validation_1 = require("./price-calculation.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)("ADMIN"));
router.post("/", (0, validate_middleware_1.validate)(pricing_validation_1.createPricingSchema), pricingController.create);
router.get("/", (0, validate_middleware_1.validate)(pricing_validation_1.listPricingSchema), pricingController.list);
router.get("/:id", (0, validate_middleware_1.validate)(pricing_validation_1.pricingIdParamsSchema), pricingController.get);
router.patch("/:id", (0, validate_middleware_1.validate)(pricing_validation_1.updatePricingSchema), pricingController.update);
router.patch("/:id/status", (0, validate_middleware_1.validate)(pricing_validation_1.updatePricingStatusSchema), pricingController.updateStatus);
router.delete("/:id", (0, validate_middleware_1.validate)(pricing_validation_1.pricingIdParamsSchema), pricingController.remove);
router.post("/calculate", auth_middleware_1.authMiddleware, (0, validate_middleware_1.validate)(price_calculation_validation_1.calculatePriceSchema), priceCalculationController.calculate);
exports.default = router;
