import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { createAndDispatchNotification } from "../notifications/notifications.service";

export async function getCod(input: { shipmentId: string; userId: string; role: string }) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
    select: { id: true, createdById: true, trackingNumber: true, assignedDriverId: true, codTransaction: true },
  });
  if (!shipment) throw new ApiError(404, "Shipment not found");
  if (!shipment.codTransaction) throw new ApiError(404, "COD not found");

  if (input.role === "CUSTOMER" && shipment.createdById !== input.userId) throw new ApiError(403, "Forbidden");
  if (input.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: input.userId } });
    if (!driver || shipment.assignedDriverId !== driver.id) throw new ApiError(403, "Forbidden");
  }

  return shipment.codTransaction;
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

