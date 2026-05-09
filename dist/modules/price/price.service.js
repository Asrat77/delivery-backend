"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePrice = calculatePrice;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
}
async function calculatePrice(input) {
    const distance = haversineDistance(input.pickupLat, input.pickupLng, input.deliveryLat, input.deliveryLng);
    const rule = await prisma_1.prisma.pricingRule.findFirst({
        where: {
            deliveryType: input.deliveryType,
            isActive: true,
        },
    });
    if (!rule) {
        throw new ApiError_1.ApiError(404, `No active pricing rule for ${input.deliveryType}`);
    }
    const baseFare = Number(rule.baseFare);
    const ratePerKm = Number(rule.ratePerKm);
    const distanceCharge = distance * ratePerKm;
    const price = Math.max(baseFare, distanceCharge);
    return {
        price,
        distance,
        deliveryType: input.deliveryType,
        breakdown: {
            baseFare,
            distanceCharge: Number(distanceCharge.toFixed(2)),
            ratePerKm,
        },
    };
}
