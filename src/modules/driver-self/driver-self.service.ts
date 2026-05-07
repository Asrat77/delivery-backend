import type { ShipmentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { assertValidTransition } from "../shipments/shipment-status";

export async function getMyShipments(userId: string) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const shipments = await prisma.shipment.findMany({
    where: { assignedDriverId: driver.id },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { timestamp: "asc" } } },
  });

  return shipments;
}

export async function updateMyLocation(userId: string, lat: number, lng: number) {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) throw new ApiError(404, "Driver profile not found");

  return prisma.driver.update({
    where: { id: driver.id },
    data: { currentLat: lat, currentLng: lng },
  });
}

export async function updateAssignedShipmentStatus(input: {
  userId: string;
  shipmentId: string;
  status: ShipmentStatus;
  locationText?: string;
  lat?: number;
  lng?: number;
}) {
  const driver = await prisma.driver.findUnique({ where: { userId: input.userId } });
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const shipment = await prisma.shipment.findUnique({ where: { id: input.shipmentId } });
  if (!shipment) throw new ApiError(404, "Shipment not found");
  if (shipment.assignedDriverId !== driver.id) throw new ApiError(403, "Forbidden");

  assertValidTransition(shipment.status, input.status);

  const updated = await prisma.shipment.update({
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

