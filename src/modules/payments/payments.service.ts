import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { createAndDispatchNotification } from "../notifications/notifications.service";

export async function getPayment(input: { shipmentId: string; userId: string; role: string }) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
    select: { id: true, createdById: true, trackingNumber: true, receiverPhone: true, payment: true },
  });
  if (!shipment) throw new ApiError(404, "Shipment not found");
  if (!shipment.payment) throw new ApiError(404, "Payment not found");

  if (input.role === "CUSTOMER" && shipment.createdById !== input.userId) throw new ApiError(403, "Forbidden");
  if (input.role === "DRIVER") throw new ApiError(403, "Forbidden");

  return shipment.payment;
}

export async function markPaid(input: { shipmentId: string; actorRole: string; providerReference?: string }) {
  if (!["ADMIN", "STAFF"].includes(input.actorRole)) throw new ApiError(403, "Forbidden");

  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
    select: { id: true, trackingNumber: true, receiverPhone: true },
  });
  if (!shipment) throw new ApiError(404, "Shipment not found");

  const payment = await prisma.payment.update({
    where: { shipmentId: shipment.id },
    data: { status: "PAID", paidAt: new Date(), providerReference: input.providerReference },
  });

  await createAndDispatchNotification({
    shipmentId: shipment.id,
    type: "PAYMENT_RECEIVED",
    message: `Payment received for shipment ${shipment.trackingNumber}.`,
    recipientPhone: shipment.receiverPhone,
  });

  return payment;
}

