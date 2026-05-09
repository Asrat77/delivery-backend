"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackByTrackingNumber = trackByTrackingNumber;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
async function trackByTrackingNumber(trackingNumber) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { trackingNumber },
        include: { events: { orderBy: { timestamp: "asc" } } },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    const latestEvent = shipment.events[shipment.events.length - 1] ?? null;
    return {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        senderName: shipment.senderName,
        senderPhone: shipment.senderPhone,
        receiverName: shipment.receiverName,
        receiverPhone: shipment.receiverPhone,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        packageType: shipment.packageType,
        weight: shipment.weight,
        latestEvent,
        events: shipment.events,
    };
}
