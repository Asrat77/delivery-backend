"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listActivity = listActivity;
exports.getActivityDetail = getActivityDetail;
const prisma_1 = require("../../config/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const pagination_1 = require("../../utils/pagination");
const qrcode_1 = __importDefault(require("qrcode"));
function getServiceLabel(serviceType, deliveryType) {
    const deliveryMode = deliveryType === "FOOT" ? "Delivery" : "Express";
    if (serviceType === "INTERNATIONAL") {
        return `International ${deliveryMode}`;
    }
    if (serviceType === "CITY") {
        return `City ${deliveryMode}`;
    }
    return `Domestic ${deliveryMode}`;
}
function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
async function getDriverByUserId(userId) {
    return prisma_1.prisma.driver.findUnique({ where: { userId }, include: { user: true } });
}
async function getDriverFromShipment(shipment) {
    if (!shipment.assignedDriverId)
        return null;
    return prisma_1.prisma.driver.findUnique({
        where: { id: shipment.assignedDriverId },
        include: { user: { select: { id: true, name: true, phone: true } } },
    });
}
async function listActivity(input) {
    const { skip, take, page, limit } = (0, pagination_1.toPagination)(input.query);
    const where = {};
    if (input.query.serviceType) {
        where.serviceType = input.query.serviceType;
    }
    if (input.role === "CUSTOMER") {
        where.OR = [
            { createdById: input.userId },
            ...(input.userPhone ? [{ receiverPhone: input.userPhone }] : []),
        ];
    }
    else if (input.role === "DRIVER") {
        const driver = await getDriverByUserId(input.userId);
        if (driver) {
            where.assignedDriverId = driver.id;
        }
        else {
            where.assignedDriverId = "no-driver";
        }
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.shipment.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                trackingNumber: true,
                pickupAddress: true,
                deliveryAddress: true,
                serviceType: true,
                deliveryType: true,
                status: true,
                price: true,
                createdAt: true,
                assignedDriver: {
                    include: {
                        user: { select: { id: true, name: true, phone: true } },
                    },
                },
            },
        }),
        prisma_1.prisma.shipment.count({ where }),
    ]);
    const enriched = items.map((s) => ({
        id: s.id,
        trackingNumber: s.trackingNumber,
        pickupAddress: s.pickupAddress,
        deliveryAddress: s.deliveryAddress,
        serviceLabel: getServiceLabel(s.serviceType, s.deliveryType),
        status: s.status,
        price: s.price,
        priceCurrency: "ETB",
        formattedDate: formatDate(s.createdAt),
        createdAt: s.createdAt,
        assignedDriver: s.assignedDriver
            ? { id: s.assignedDriver.user.id, name: s.assignedDriver.user.name }
            : null,
    }));
    return { items: enriched, page, limit, total };
}
async function getActivityDetail(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        include: {
            events: { orderBy: { timestamp: "asc" } },
            payment: true,
            codTransaction: true,
            deliveryProof: true,
            assignedDriver: {
                include: {
                    user: { select: { id: true, name: true, phone: true, email: true, role: true } },
                },
            },
            createdBy: { select: { id: true, name: true, phone: true, email: true, role: true } },
        },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    if (input.role === "CUSTOMER") {
        const isCreator = shipment.createdById === input.userId;
        const isReceiver = input.userPhone ? shipment.receiverPhone === input.userPhone : false;
        if (!isCreator && !isReceiver)
            throw new ApiError_1.ApiError(403, "Forbidden");
    }
    if (input.role === "DRIVER") {
        const driver = await getDriverByUserId(input.userId);
        if (!driver || shipment.assignedDriverId !== driver.id)
            throw new ApiError_1.ApiError(403, "Forbidden");
    }
    const env = (0, env_1.getEnv)();
    const qrUrl = `${env.APP_PUBLIC_URL}/track/${shipment.trackingNumber}`;
    const qrCode = await qrcode_1.default.toDataURL(qrUrl);
    return {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        orderId: shipment.id,
        serviceLabel: getServiceLabel(shipment.serviceType, shipment.deliveryType),
        status: shipment.status,
        date: shipment.createdAt,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        amount: shipment.price,
        paymentMethod: shipment.payment?.method ?? "CASH",
        deliveryType: shipment.deliveryType,
        driver: shipment.assignedDriver
            ? {
                id: shipment.assignedDriver.user.id,
                name: shipment.assignedDriver.user.name,
                phone: shipment.assignedDriver.user.phone,
            }
            : null,
        qrCode,
        events: shipment.events,
    };
}
