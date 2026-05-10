"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePrice = calculatePrice;
const pricing_calculator_1 = require("../pricing/pricing-calculator");
async function calculatePrice(input) {
    return (0, pricing_calculator_1.computePrice)({
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        deliveryLat: input.deliveryLat,
        deliveryLng: input.deliveryLng,
        deliveryType: input.deliveryType,
        serviceType: input.serviceType,
        packageType: input.packageType,
        weight: input.weight,
    });
}
