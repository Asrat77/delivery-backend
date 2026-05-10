import { prisma } from "../../config/prisma";
import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { toPagination } from "../../utils/pagination";
import QRCode from "qrcode";

function getServiceLabel(serviceType: string, deliveryType: string): string {
  if (serviceType === "INTERNATIONAL") {
    return deliveryType === "FOOT" ? "International Delivery" : "International Express";
  }
  return deliveryType === "FOOT" ? "City Delivery" : "City Express";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function getDriverByUserId(userId: string) {
  return prisma.driver.findUnique({ where: { userId }, include: { user: true } });
}

async function getDriverFromShipment(shipment: any) {
  if (!shipment.assignedDriverId) return null;
  return prisma.driver.findUnique({
    where: { id: shipment.assignedDriverId },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });
}

export async function listActivity(input: {
  userId: string;
  role: string;
  userPhone?: string;
  query: any;
}) {
  const { skip, take, page, limit } = toPagination(input.query);
  const where: any = {};

  if (input.query.serviceType) {
    where.serviceType = input.query.serviceType;
  }

  if (input.role === "CUSTOMER") {
    where.OR = [
      { createdById: input.userId },
      ...(input.userPhone ? [{ receiverPhone: input.userPhone }] : []),
    ];
  } else if (input.role === "DRIVER") {
    const driver = await getDriverByUserId(input.userId);
    if (driver) {
      where.assignedDriverId = driver.id;
    } else {
      where.assignedDriverId = "no-driver";
    }
  }

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
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
    prisma.shipment.count({ where }),
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

export async function getActivityDetail(input: {
  shipmentId: string;
  userId: string;
  role: string;
  userPhone?: string;
}) {
  const shipment = await prisma.shipment.findUnique({
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

  if (!shipment) throw new ApiError(404, "Shipment not found");

  if (input.role === "CUSTOMER") {
    const isCreator = shipment.createdById === input.userId;
    const isReceiver = input.userPhone ? shipment.receiverPhone === input.userPhone : false;
    if (!isCreator && !isReceiver) throw new ApiError(403, "Forbidden");
  }
  if (input.role === "DRIVER") {
    const driver = await getDriverByUserId(input.userId);
    if (!driver || shipment.assignedDriverId !== driver.id) throw new ApiError(403, "Forbidden");
  }

  const env = getEnv();
  const qrUrl = `${env.APP_PUBLIC_URL}/track/${shipment.trackingNumber}`;
  const qrCode = await QRCode.toDataURL(qrUrl);

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
