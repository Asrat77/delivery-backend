import type { DeliveryType, PaymentMethod, ShipmentStatus } from "@prisma/client";
import QRCode from "qrcode";
import { prisma } from "../../config/prisma";
import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { generateTrackingNumber } from "../../utils/generateTrackingNumber";
import { toPagination } from "../../utils/pagination";
import { generateOtp, hashOtp, otpExpiresAt, verifyOtp } from "../../utils/otp";
import { assertValidTransition } from "./shipment-status";
import { calculatePrice } from "../pricing/pricing.service";
import { createAndDispatchNotification } from "../notifications/notifications.service";

async function generateUniqueTrackingNumber() {
  for (let i = 0; i < 10; i++) {
    const tn = generateTrackingNumber();
    const exists = await prisma.shipment.findUnique({ where: { trackingNumber: tn }, select: { id: true } });
    if (!exists) return tn;
  }
  throw new ApiError(500, "Failed to generate unique tracking number");
}

export async function createShipment(input: {
  actorUserId: string;
  actorRole: string;
  data: {
    senderName: string;
    senderPhone: string;
    receiverName: string;
    receiverPhone: string;
    pickupAddress: string;
    deliveryAddress: string;
    pickupLat?: number;
    pickupLng?: number;
    deliveryLat?: number;
    deliveryLng?: number;
    packageType: string;
    weight: number;
    price?: number;
    deliveryType?: DeliveryType;
    paymentMethod: PaymentMethod;
    codAmount?: number;
  };
}) {
  const env = getEnv();
  const trackingNumber = await generateUniqueTrackingNumber();

  const weight = input.data.weight;
  const computedPrice =
    input.data.price ??
    (await calculatePrice({
      packageType: input.data.packageType,
      weight,
    }));

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = otpExpiresAt(15);

  const result = await prisma.$transaction(async (tx) => {
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
        deliveryType: input.data.deliveryType,
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
        codTransaction:
          input.data.codAmount && input.data.codAmount > 0
            ? {
                create: { amount: input.data.codAmount },
              }
            : undefined,
      },
      include: { deliveryProof: true, payment: true, codTransaction: true },
    });

    return shipment;
  });

  await createAndDispatchNotification({
    userId: input.actorUserId,
    shipmentId: result.id,
    type: "SHIPMENT_CREATED",
    message: `Shipment created. Tracking: ${result.trackingNumber}`,
    recipientPhone: result.receiverPhone,
  });

  const response: any = {
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

export async function listShipments(input: {
  userId: string;
  userPhone?: string;
  role: string;
  query: any;
}) {
  const { skip, take, page, limit } = toPagination(input.query);
  const where: any = {};

  if (input.query.status) where.status = input.query.status;
  if (input.query.assignedDriverId) where.assignedDriverId = input.query.assignedDriverId;
  if (input.query.trackingNumber) where.trackingNumber = { contains: input.query.trackingNumber, mode: "insensitive" };
  if (input.query.senderPhone) where.senderPhone = { contains: input.query.senderPhone };
  if (input.query.receiverPhone) where.receiverPhone = { contains: input.query.receiverPhone };

  if (input.query.dateFrom || input.query.dateTo) {
    where.createdAt = {};
    if (input.query.dateFrom) where.createdAt.gte = new Date(input.query.dateFrom);
    if (input.query.dateTo) where.createdAt.lte = new Date(input.query.dateTo);
  }

  if (input.role === "CUSTOMER") {
    where.OR = [
      { createdById: input.userId },
      ...(input.userPhone ? [{ receiverPhone: input.userPhone }] : []),
    ];
  } else if (input.role === "DRIVER") {
    throw new ApiError(403, "Drivers must use /driver/shipments");
  }

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: { id: true, trackingNumber: true, status: true, senderName: true, receiverName: true, createdAt: true },
    }),
    prisma.shipment.count({ where }),
  ]);

  return { items, page, limit, total };
}

export async function getShipmentById(input: { shipmentId: string; userId: string; userPhone?: string; role: string }) {
  const shipment = await prisma.shipment.findUnique({
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
  if (!shipment) throw new ApiError(404, "Shipment not found");

  if (input.role === "CUSTOMER") {
    const isCreator = shipment.createdById === input.userId;
    const isReceiver = input.userPhone ? shipment.receiverPhone === input.userPhone : false;
    if (!isCreator && !isReceiver) throw new ApiError(403, "Forbidden");
  }
  if (input.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: input.userId } });
    if (!driver || shipment.assignedDriverId !== driver.id) throw new ApiError(403, "Forbidden");
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

export async function assignDriver(input: { shipmentId: string; driverId: string; assignedById: string }) {
  const driver = await prisma.driver.findUnique({ where: { id: input.driverId }, include: { user: true } });
  if (!driver) throw new ApiError(404, "Driver not found");
  if (driver.user.role !== "DRIVER") throw new ApiError(400, "User is not a DRIVER");

  const shipment = await prisma.shipment.update({
    where: { id: input.shipmentId },
    data: { assignedDriverId: driver.id, assignedById: input.assignedById },
  });
  return shipment;
}

export async function updateShipmentStatus(input: {
  shipmentId: string;
  status: ShipmentStatus;
  actorUserId: string;
  actorRole: string;
}) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
    include: { deliveryProof: true, codTransaction: true },
  });
  if (!shipment) throw new ApiError(404, "Shipment not found");

  if (input.status === "CANCELLED") {
    if (!["ADMIN", "STAFF"].includes(input.actorRole)) throw new ApiError(403, "Forbidden");
    if (shipment.status === "DELIVERED") throw new ApiError(400, "Cannot cancel delivered shipment");
  }

  assertValidTransition(shipment.status, input.status);

  if (input.status === "DELIVERED") {
    if (!shipment.deliveryProof?.verified) throw new ApiError(400, "OTP must be verified before delivery");
    if (shipment.codTransaction && !shipment.codTransaction.collected) {
      throw new ApiError(400, "COD must be collected before delivery");
    }
  }

  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: input.status,
      events: { create: { status: input.status, actorId: input.actorUserId } },
    },
  });

  if (input.status === "OUT_FOR_DELIVERY") {
    await createAndDispatchNotification({
      shipmentId: shipment.id,
      type: "OUT_FOR_DELIVERY",
      message: `Shipment ${shipment.trackingNumber} is out for delivery.`,
      recipientPhone: shipment.receiverPhone,
    });
  }

  if (input.status === "DELIVERED") {
    await createAndDispatchNotification({
      shipmentId: shipment.id,
      type: "DELIVERED",
      message: `Shipment ${shipment.trackingNumber} delivered.`,
      recipientPhone: shipment.receiverPhone,
    });
  }

  return updated;
}

export async function getShipmentQrDataUrl(shipmentId: string) {
  const env = getEnv();
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId }, select: { trackingNumber: true } });
  if (!shipment) throw new ApiError(404, "Shipment not found");
  const url = `${env.APP_PUBLIC_URL}/track/${shipment.trackingNumber}`;
  return QRCode.toDataURL(url);
}

export async function verifyShipmentOtp(input: { shipmentId: string; otp: string }) {
  const proof = await prisma.deliveryProof.findUnique({ where: { shipmentId: input.shipmentId } });
  if (!proof) throw new ApiError(404, "Delivery proof not found");
  if (!proof.otpCodeHash) throw new ApiError(400, "OTP not configured for this shipment");
  if (proof.verified) return proof;
  if (proof.otpExpiresAt && proof.otpExpiresAt.getTime() < Date.now()) throw new ApiError(400, "OTP expired");

  const ok = await verifyOtp(input.otp, proof.otpCodeHash);
  if (!ok) throw new ApiError(400, "Invalid OTP");

  return prisma.deliveryProof.update({
    where: { id: proof.id },
    data: { verified: true, verifiedAt: new Date() },
  });
}

