import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { getRouteDistance } from "../routing/routing.service";

export async function calculatePrice(input: {
  deliveryType: "BICYCLE" | "MOTORBIKE" | "FOOT";
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  serviceType?: string;
}) {
  const route = await getRouteDistance({
    pickupLat: input.pickupLat,
    pickupLng: input.pickupLng,
    deliveryLat: input.deliveryLat,
    deliveryLng: input.deliveryLng,
    deliveryType: input.deliveryType,
  });

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
  let distanceCharge = route.distanceKm * ratePerKm;
  let price = Math.max(baseFare, distanceCharge);

  if (input.serviceType === "INTERNATIONAL") {
    price = Math.round(price * 1.5 * 100) / 100;
  }

  return {
    price,
    distanceMeters: route.distanceMeters,
    distanceKm: route.distanceKm,
    durationSeconds: route.durationSeconds,
    deliveryType: input.deliveryType,
    serviceType: input.serviceType ?? "DOMESTIC",
    breakdown: {
      baseFare,
      distanceCharge: Number(distanceCharge.toFixed(2)),
      ratePerKm,
      via: route.via,
      ...(input.serviceType === "INTERNATIONAL" ? { internationalMultiplier: 1.5 } : {}),
    },
  };
}
