import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

export async function trackByTrackingNumber(trackingNumber: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    include: { events: { orderBy: { timestamp: "asc" } } },
  });
  if (!shipment) throw new ApiError(404, "Shipment not found");

  const latestEvent = shipment.events[shipment.events.length - 1] ?? null;

  return {
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    senderName: shipment.senderName,
    senderPhone: shipment.senderPhone,
    receiverName: shipment.receiverName,
    receiverPhone: shipment.receiverPhone,
    pickupAddress: shipment.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    packageType: shipment.packageType,
    weight: shipment.weight,
    latestEvent,
    events: shipment.events,
  };
}

