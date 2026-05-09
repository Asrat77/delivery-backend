"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayment = getPayment;
exports.markPaid = markPaid;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const notifications_service_1 = require("../notifications/notifications.service");
async function getPayment(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        select: { id: true, createdById: true, trackingNumber: true, receiverPhone: true, payment: true },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    if (!shipment.payment)
        throw new ApiError_1.ApiError(404, "Payment not found");
    if (input.role === "CUSTOMER" && shipment.createdById !== input.userId)
        throw new ApiError_1.ApiError(403, "Forbidden");
    if (input.role === "DRIVER")
        throw new ApiError_1.ApiError(403, "Forbidden");
    return shipment.payment;
}
async function markPaid(input) {
    if (!["ADMIN", "STAFF"].includes(input.actorRole))
        throw new ApiError_1.ApiError(403, "Forbidden");
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        select: { id: true, trackingNumber: true, receiverPhone: true },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    const payment = await prisma_1.prisma.payment.update({
        where: { shipmentId: shipment.id },
        data: { status: "PAID", paidAt: new Date(), providerReference: input.providerReference },
    });
    await (0, notifications_service_1.createAndDispatchNotification)({
        shipmentId: shipment.id,
        type: "PAYMENT_RECEIVED",
        message: `Payment received for shipment ${shipment.trackingNumber}.`,
        recipientPhone: shipment.receiverPhone,
    });
    return payment;
}
