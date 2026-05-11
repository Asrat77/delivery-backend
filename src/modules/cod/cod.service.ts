import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { createAndDispatchNotification } from "../notifications/notifications.service";
import { toPagination } from "../../utils/pagination";

export async function listCod(input: { query: any }) {
  const { skip, take, page, limit } = toPagination(input.query);
  const where: any = {};

  if (input.query.status === "COLLECTED") {
    where.collected = true;
  } else if (input.query.status === "PENDING") {
    where.collected = false;
  }

  if (input.query.driverId) {
    where.collectedByDriverId = input.query.driverId;
  }

  if (input.query.dateFrom || input.query.dateTo) {
    where.shipment = { createdAt: {} };
    if (input.query.dateFrom) where.shipment.createdAt.gte = new Date(input.query.dateFrom);
    if (input.query.dateTo) where.shipment.createdAt.lte = new Date(input.query.dateTo);
  }

  const [items, total] = await Promise.all([
    prisma.codTransaction.findMany({
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
    prisma.codTransaction.count({ where }),
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

export async function getCod(input: { shipmentId: string; userId: string; role: string }) {
  const shipment = await prisma.shipment.findUnique({
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
  if (!shipment) throw new ApiError(404, "Shipment not found");
  if (!shipment.codTransaction) throw new ApiError(404, "COD not found");

  if (input.role === "CUSTOMER" && shipment.createdById !== input.userId) throw new ApiError(403, "Forbidden");
  if (input.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: input.userId } });
    if (!driver || shipment.assignedDriverId !== driver.id) throw new ApiError(403, "Forbidden");
  }

  return {
    ...shipment.codTransaction,
    shipmentPrice: shipment.price,
  };
}

export async function markCollected(input: { shipmentId: string; userId: string; role: string }) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
    select: { id: true, trackingNumber: true, receiverPhone: true, assignedDriverId: true, codTransaction: true },
  });
  if (!shipment) throw new ApiError(404, "Shipment not found");
  if (!shipment.codTransaction) throw new ApiError(404, "COD not found");

  let collectedByDriverId: string | null = null;
  if (input.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: input.userId } });
    if (!driver || shipment.assignedDriverId !== driver.id) throw new ApiError(403, "Forbidden");
    collectedByDriverId = driver.id;
  } else if (!["ADMIN", "STAFF"].includes(input.role)) {
    throw new ApiError(403, "Forbidden");
  }

  const cod = await prisma.codTransaction.update({
    where: { shipmentId: shipment.id },
    data: { collected: true, collectedAt: new Date(), collectedByDriverId },
  });

  await createAndDispatchNotification({
    shipmentId: shipment.id,
    type: "COD_COLLECTED",
    message: `COD collected for shipment ${shipment.trackingNumber}.`,
    recipientPhone: shipment.receiverPhone,
  });

  return cod;
}

