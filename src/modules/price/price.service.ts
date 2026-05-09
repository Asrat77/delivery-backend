import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export async function calculatePrice(input: {
  deliveryType: "BICYCLE" | "MOTORBIKE";
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
}) {
  const distance = haversineDistance(
    input.pickupLat,
    input.pickupLng,
    input.deliveryLat,
    input.deliveryLng
  );

  const rule = await prisma.pricingRule.findFirst({
    where: {
      deliveryType: input.deliveryType,
      isActive: true,
    },
  });

  if (!rule) {
    throw new ApiError(404, `No active pricing rule for ${input.deliveryType}`);
  }

  const baseFare = Number(rule.baseFare);
  const ratePerKm = Number(rule.ratePerKm);
  const distanceCharge = distance * ratePerKm;
  const price = Math.max(baseFare, distanceCharge);

  return {
    price,
    distance,
    deliveryType: input.deliveryType,
    breakdown: {
      baseFare,
      distanceCharge: Number(distanceCharge.toFixed(2)),
      ratePerKm,
    },
  };
}