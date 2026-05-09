"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyShipments = getMyShipments;
exports.updateMyLocation = updateMyLocation;
exports.updateAssignedShipmentStatus = updateAssignedShipmentStatus;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const shipment_status_1 = require("../shipments/shipment-status");
async function getMyShipments(userId) {
    const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
    if (!driver)
        throw new ApiError_1.ApiError(404, "Driver profile not found");
    const shipments = await prisma_1.prisma.shipment.findMany({
        where: { assignedDriverId: driver.id },
        orderBy: { createdAt: "desc" },
        include: { events: { orderBy: { timestamp: "asc" } } },
    });
    return shipments;
}
async function updateMyLocation(userId, lat, lng) {
    const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
    if (!driver)
        throw new ApiError_1.ApiError(404, "Driver profile not found");
    return prisma_1.prisma.driver.update({
        where: { id: driver.id },
        data: { currentLat: lat, currentLng: lng },
    });
}
async function updateAssignedShipmentStatus(input) {
    const driver = await prisma_1.prisma.driver.findUnique({ where: { userId: input.userId } });
    if (!driver)
        throw new ApiError_1.ApiError(404, "Driver profile not found");
    const shipment = await prisma_1.prisma.shipment.findUnique({ where: { id: input.shipmentId } });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    if (shipment.assignedDriverId !== driver.id)
        throw new ApiError_1.ApiError(403, "Forbidden");
    (0, shipment_status_1.assertValidTransition)(shipment.status, input.status);
    const updated = await prisma_1.prisma.shipment.update({
        where: { id: shipment.id },
        data: {
            status: input.status,
            events: {
                create: {
                    status: input.status,
                    locationText: input.locationText,
                    lat: input.lat,
                    lng: input.lng,
                    actorId: input.userId,
                },
            },
        },
        include: { events: { orderBy: { timestamp: "asc" } } },
    });
    return updated;
}
