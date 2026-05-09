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
exports.remove = exports.updateStatus = exports.update = exports.get = exports.list = exports.create = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const pricingService = __importStar(require("./pricing.service"));
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const rule = await pricingService.createPricingRule(req.body);
    return res.status(201).json((0, response_1.successResponse)("Pricing rule created", rule));
});
exports.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await pricingService.listPricingRules(req.query);
    return res.status(200).json((0, response_1.successResponse)("Pricing rules", data));
});
exports.get = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const rule = await pricingService.getPricingRule(String(req.params.id));
    return res.status(200).json((0, response_1.successResponse)("Pricing rule", rule));
});
exports.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const rule = await pricingService.updatePricingRule(String(req.params.id), req.body);
    return res.status(200).json((0, response_1.successResponse)("Pricing rule updated", rule));
});
exports.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const rule = await pricingService.updatePricingRuleStatus(String(req.params.id), req.body.isActive);
    return res.status(200).json((0, response_1.successResponse)("Pricing rule status updated", rule));
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await pricingService.deletePricingRule(String(req.params.id));
    return res.status(200).json((0, response_1.successResponse)("Pricing rule deleted", {}));
});
