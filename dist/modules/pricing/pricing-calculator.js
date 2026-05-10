"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePrice = computePrice;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const routing_service_1 = require("../routing/routing.service");
async function computePrice(input) {
    const route = await (0, routing_service_1.getRouteDistance)({
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        deliveryLat: input.deliveryLat,
        deliveryLng: input.deliveryLng,
        deliveryType: input.deliveryType,
    });
    const rule = await prisma_1.prisma.pricingRule.findFirst({
        where: { deliveryType: input.deliveryType, isActive: true },
    });
    if (!rule) {
        throw new ApiError_1.ApiError(404, `No active pricing rule for ${input.deliveryType}`);
    }
    const baseFare = Number(rule.baseFare);
    const ratePerKm = Number(rule.ratePerKm);
    let price = Math.max(baseFare, route.distanceKm * ratePerKm);
    if (input.serviceType === "INTERNATIONAL") {
        price = Math.round(price * 1.5 * 100) / 100;
    }
    return {
        price,
        distanceMeters: route.distanceMeters,
        distanceKm: route.distanceKm,
        durationSeconds: route.durationSeconds,
        deliveryType: input.deliveryType,
        serviceType: input.serviceType ?? "CITY",
        breakdown: {
            baseFare,
            distanceCharge: Number((route.distanceKm * ratePerKm).toFixed(2)),
            ratePerKm,
            via: route.via,
            ...(input.serviceType === "INTERNATIONAL" ? { internationalMultiplier: 1.5 } : {}),
        },
    };
}
