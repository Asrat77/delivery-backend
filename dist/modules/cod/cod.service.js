"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCod = getCod;
exports.markCollected = markCollected;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const notifications_service_1 = require("../notifications/notifications.service");
async function getCod(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        select: { id: true, createdById: true, trackingNumber: true, assignedDriverId: true, codTransaction: true },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    if (!shipment.codTransaction)
        throw new ApiError_1.ApiError(404, "COD not found");
    if (input.role === "CUSTOMER" && shipment.createdById !== input.userId)
        throw new ApiError_1.ApiError(403, "Forbidden");
    if (input.role === "DRIVER") {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId: input.userId } });
        if (!driver || shipment.assignedDriverId !== driver.id)
            throw new ApiError_1.ApiError(403, "Forbidden");
    }
    return shipment.codTransaction;
}
async function markCollected(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        select: { id: true, trackingNumber: true, receiverPhone: true, assignedDriverId: true, codTransaction: true },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    if (!shipment.codTransaction)
        throw new ApiError_1.ApiError(404, "COD not found");
    let collectedByDriverId = null;
    if (input.role === "DRIVER") {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId: input.userId } });
        if (!driver || shipment.assignedDriverId !== driver.id)
            throw new ApiError_1.ApiError(403, "Forbidden");
        collectedByDriverId = driver.id;
    }
    else if (!["ADMIN", "STAFF"].includes(input.role)) {
        throw new ApiError_1.ApiError(403, "Forbidden");
    }
    const cod = await prisma_1.prisma.codTransaction.update({
        where: { shipmentId: shipment.id },
        data: { collected: true, collectedAt: new Date(), collectedByDriverId },
    });
    await (0, notifications_service_1.createAndDispatchNotification)({
        shipmentId: shipment.id,
        type: "COD_COLLECTED",
        message: `COD collected for shipment ${shipment.trackingNumber}.`,
        recipientPhone: shipment.receiverPhone,
    });
    return cod;
}
