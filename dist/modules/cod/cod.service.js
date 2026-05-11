"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCod = listCod;
exports.getCod = getCod;
exports.markCollected = markCollected;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const notifications_service_1 = require("../notifications/notifications.service");
const pagination_1 = require("../../utils/pagination");
async function listCod(input) {
    const { skip, take, page, limit } = (0, pagination_1.toPagination)(input.query);
    const where = {};
    if (input.query.status === "COLLECTED") {
        where.collected = true;
    }
    else if (input.query.status === "PENDING") {
        where.collected = false;
    }
    if (input.query.driverId) {
        where.collectedByDriverId = input.query.driverId;
    }
    if (input.query.dateFrom || input.query.dateTo) {
        where.shipment = { createdAt: {} };
        if (input.query.dateFrom)
            where.shipment.createdAt.gte = new Date(input.query.dateFrom);
        if (input.query.dateTo)
            where.shipment.createdAt.lte = new Date(input.query.dateTo);
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.codTransaction.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                shipment: {
                    select: {
                        id: true,
                        trackingNumber: true,
                        status: true,
                        price: true,
                        createdAt: true,
                        assignedDriver: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma_1.prisma.codTransaction.count({ where }),
    ]);
    return {
        items: items.map((cod) => ({
            id: cod.id,
            amount: cod.amount,
            collected: cod.collected,
            collectedAt: cod.collectedAt,
            collectedByDriverId: cod.collectedByDriverId,
            createdAt: cod.createdAt,
            shipment: cod.shipment
                ? {
                    id: cod.shipment.id,
                    trackingNumber: cod.shipment.trackingNumber,
                    status: cod.shipment.status,
                    price: cod.shipment.price,
                    createdAt: cod.shipment.createdAt,
                    driver: cod.shipment.assignedDriver
                        ? {
                            id: cod.shipment.assignedDriver.user.id,
                            name: cod.shipment.assignedDriver.user.name,
                        }
                        : null,
                }
                : null,
        })),
        page,
        limit,
        total,
    };
}
async function getCod(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        select: {
            id: true,
            price: true,
            createdById: true,
            trackingNumber: true,
            assignedDriverId: true,
            codTransaction: true,
        },
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
    return {
        ...shipment.codTransaction,
        shipmentPrice: shipment.price,
    };
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
