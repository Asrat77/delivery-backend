"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShipment = createShipment;
exports.listShipments = listShipments;
exports.getShipmentById = getShipmentById;
exports.assignDriver = assignDriver;
exports.updateShipmentStatus = updateShipmentStatus;
exports.getShipmentQrDataUrl = getShipmentQrDataUrl;
exports.verifyShipmentOtp = verifyShipmentOtp;
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../../config/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const generateTrackingNumber_1 = require("../../utils/generateTrackingNumber");
const pagination_1 = require("../../utils/pagination");
const otp_1 = require("../../utils/otp");
const shipment_status_1 = require("./shipment-status");
const pricing_service_1 = require("../pricing/pricing.service");
const notifications_service_1 = require("../notifications/notifications.service");
const routing_service_1 = require("../routing/routing.service");
async function generateUniqueTrackingNumber() {
    for (let i = 0; i < 10; i++) {
        const tn = (0, generateTrackingNumber_1.generateTrackingNumber)();
        const exists = await prisma_1.prisma.shipment.findUnique({ where: { trackingNumber: tn }, select: { id: true } });
        if (!exists)
            return tn;
    }
    throw new ApiError_1.ApiError(500, "Failed to generate unique tracking number");
}
async function createShipment(input) {
    const env = (0, env_1.getEnv)();
    const trackingNumber = await generateUniqueTrackingNumber();
    const route = await (0, routing_service_1.getRouteDistance)({
        pickupLat: input.data.pickupLat,
        pickupLng: input.data.pickupLng,
        deliveryLat: input.data.deliveryLat,
        deliveryLng: input.data.deliveryLng,
        deliveryType: input.data.deliveryType,
    });
    const weight = input.data.weight;
    const computedPrice = input.data.price ??
        (await (0, pricing_service_1.calculatePrice)({
            packageType: input.data.packageType,
            weight,
            serviceType: input.data.serviceType,
            deliveryType: input.data.deliveryType,
        }));
    const otp = (0, otp_1.generateOtp)();
    const otpHash = await (0, otp_1.hashOtp)(otp);
    const expiresAt = (0, otp_1.otpExpiresAt)(15);
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.create({
            data: {
                trackingNumber,
                senderName: input.data.senderName,
                senderPhone: input.data.senderPhone,
                receiverName: input.data.receiverName,
                receiverPhone: input.data.receiverPhone,
                pickupAddress: input.data.pickupAddress,
                deliveryAddress: input.data.deliveryAddress,
                pickupLat: input.data.pickupLat,
                pickupLng: input.data.pickupLng,
                deliveryLat: input.data.deliveryLat,
                deliveryLng: input.data.deliveryLng,
                packageType: input.data.packageType,
                weight,
                price: computedPrice,
                serviceType: input.data.serviceType,
                deliveryType: input.data.deliveryType,
                distanceMeters: route.distanceMeters,
                durationSeconds: route.durationSeconds,
                createdById: input.actorRole === "DRIVER" ? null : input.actorUserId,
                events: { create: { status: "CREATED", actorId: input.actorUserId } },
                deliveryProof: {
                    create: {
                        type: "OTP",
                        otpCodeHash: otpHash,
                        otpExpiresAt: expiresAt,
                        verified: false,
                    },
                },
                payment: {
                    create: {
                        amount: computedPrice,
                        method: input.data.paymentMethod,
                        status: "PENDING",
                    },
                },
                codTransaction: input.data.codAmount && input.data.codAmount > 0
                    ? {
                        create: { amount: input.data.codAmount },
                    }
                    : undefined,
            },
            include: { deliveryProof: true, payment: true, codTransaction: true },
        });
        return shipment;
    });
    await (0, notifications_service_1.createAndDispatchNotification)({
        userId: input.actorUserId,
        shipmentId: result.id,
        type: "SHIPMENT_CREATED",
        message: `Shipment created. Tracking: ${result.trackingNumber}`,
        recipientPhone: result.receiverPhone,
    });
    const response = {
        ...result,
        deliveryProof: result.deliveryProof
            ? {
                id: result.deliveryProof.id,
                type: result.deliveryProof.type,
                verified: result.deliveryProof.verified,
                verifiedAt: result.deliveryProof.verifiedAt,
                otpExpiresAt: result.deliveryProof.otpExpiresAt,
            }
            : null,
    };
    if (env.NODE_ENV === "development") {
        response.devOtp = otp;
    }
    return response;
}
async function listShipments(input) {
    const { skip, take, page, limit } = (0, pagination_1.toPagination)(input.query);
    const where = {};
    if (input.query.status)
        where.status = input.query.status;
    if (input.query.assignedDriverId)
        where.assignedDriverId = input.query.assignedDriverId;
    if (input.query.trackingNumber)
        where.trackingNumber = { contains: input.query.trackingNumber, mode: "insensitive" };
    if (input.query.senderPhone)
        where.senderPhone = { contains: input.query.senderPhone };
    if (input.query.receiverPhone)
        where.receiverPhone = { contains: input.query.receiverPhone };
    if (input.query.serviceType)
        where.serviceType = input.query.serviceType;
    if (input.query.dateFrom || input.query.dateTo) {
        where.createdAt = {};
        if (input.query.dateFrom)
            where.createdAt.gte = new Date(input.query.dateFrom);
        if (input.query.dateTo)
            where.createdAt.lte = new Date(input.query.dateTo);
    }
    if (input.role === "CUSTOMER") {
        where.OR = [
            { createdById: input.userId },
            ...(input.userPhone ? [{ receiverPhone: input.userPhone }] : []),
        ];
    }
    else if (input.role === "DRIVER") {
        throw new ApiError_1.ApiError(403, "Drivers must use /driver/shipments");
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.shipment.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            select: { id: true, trackingNumber: true, status: true, senderName: true, receiverName: true, createdAt: true },
        }),
        prisma_1.prisma.shipment.count({ where }),
    ]);
    return { items, page, limit, total };
}
async function getShipmentById(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        include: {
            events: { orderBy: { timestamp: "asc" } },
            payment: true,
            codTransaction: true,
            deliveryProof: true,
            assignedDriver: { include: { user: { select: { id: true, name: true, phone: true, email: true, role: true } } } },
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
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId: input.userId } });
        if (!driver || shipment.assignedDriverId !== driver.id)
            throw new ApiError_1.ApiError(403, "Forbidden");
    }
    const safe = {
        ...shipment,
        deliveryProof: shipment.deliveryProof
            ? {
                id: shipment.deliveryProof.id,
                type: shipment.deliveryProof.type,
                verified: shipment.deliveryProof.verified,
                verifiedAt: shipment.deliveryProof.verifiedAt,
                otpExpiresAt: shipment.deliveryProof.otpExpiresAt,
                photoUrl: shipment.deliveryProof.photoUrl,
            }
            : null,
    };
    return safe;
}
async function assignDriver(input) {
    let driver = await prisma_1.prisma.driver.findUnique({ where: { id: input.driverId }, include: { user: true } });
    if (!driver) {
        driver = await prisma_1.prisma.driver.findUnique({ where: { userId: input.driverId }, include: { user: true } });
        if (!driver)
            throw new ApiError_1.ApiError(404, "Driver not found");
    }
    if (driver.user.role !== "DRIVER")
        throw new ApiError_1.ApiError(400, "User is not a DRIVER");
    const shipment = await prisma_1.prisma.shipment.findUnique({ where: { id: input.shipmentId } });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    const updated = await prisma_1.prisma.shipment.update({
        where: { id: input.shipmentId },
        data: { assignedDriverId: driver.id, assignedById: input.assignedById },
    });
    await prisma_1.prisma.driver.update({ where: { id: driver.id }, data: { isAvailable: false } });
    return updated;
}
async function updateShipmentStatus(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({
        where: { id: input.shipmentId },
        include: { deliveryProof: true, codTransaction: true },
    });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    if (input.status === "CANCELLED") {
        if (!["ADMIN", "STAFF"].includes(input.actorRole))
            throw new ApiError_1.ApiError(403, "Forbidden");
        if (shipment.status === "DELIVERED")
            throw new ApiError_1.ApiError(400, "Cannot cancel delivered shipment");
    }
    (0, shipment_status_1.assertValidTransition)(shipment.status, input.status);
    if (input.status === "DELIVERED") {
        if (!shipment.deliveryProof?.verified)
            throw new ApiError_1.ApiError(400, "OTP must be verified before delivery");
        if (shipment.codTransaction && !shipment.codTransaction.collected) {
            throw new ApiError_1.ApiError(400, "COD must be collected before delivery");
        }
    }
    const updated = await prisma_1.prisma.shipment.update({
        where: { id: shipment.id },
        data: {
            status: input.status,
            events: { create: { status: input.status, actorId: input.actorUserId } },
        },
    });
    if (input.status === "OUT_FOR_DELIVERY") {
        await (0, notifications_service_1.createAndDispatchNotification)({
            shipmentId: shipment.id,
            type: "OUT_FOR_DELIVERY",
            message: `Shipment ${shipment.trackingNumber} is out for delivery.`,
            recipientPhone: shipment.receiverPhone,
        });
    }
    if (input.status === "DELIVERED") {
        await (0, notifications_service_1.createAndDispatchNotification)({
            shipmentId: shipment.id,
            type: "DELIVERED",
            message: `Shipment ${shipment.trackingNumber} delivered.`,
            recipientPhone: shipment.receiverPhone,
        });
    }
    if (shipment.assignedDriverId && (input.status === "DELIVERED" || input.status === "CANCELLED")) {
        await prisma_1.prisma.driver.update({ where: { id: shipment.assignedDriverId }, data: { isAvailable: true } });
    }
    return updated;
}
async function getShipmentQrDataUrl(shipmentId) {
    const env = (0, env_1.getEnv)();
    const shipment = await prisma_1.prisma.shipment.findUnique({ where: { id: shipmentId }, select: { trackingNumber: true } });
    if (!shipment)
        throw new ApiError_1.ApiError(404, "Shipment not found");
    const url = `${env.APP_PUBLIC_URL}/track/${shipment.trackingNumber}`;
    return qrcode_1.default.toDataURL(url);
}
async function verifyShipmentOtp(input) {
    const proof = await prisma_1.prisma.deliveryProof.findUnique({ where: { shipmentId: input.shipmentId } });
    if (!proof)
        throw new ApiError_1.ApiError(404, "Delivery proof not found");
    if (!proof.otpCodeHash)
        throw new ApiError_1.ApiError(400, "OTP not configured for this shipment");
    if (proof.verified)
        return proof;
    if (proof.otpExpiresAt && proof.otpExpiresAt.getTime() < Date.now())
        throw new ApiError_1.ApiError(400, "OTP expired");
    const ok = await (0, otp_1.verifyOtp)(input.otp, proof.otpCodeHash);
    if (!ok)
        throw new ApiError_1.ApiError(400, "Invalid OTP");
    return prisma_1.prisma.deliveryProof.update({
        where: { id: proof.id },
        data: { verified: true, verifiedAt: new Date() },
    });
}
