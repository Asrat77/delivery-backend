import { computePrice } from "../pricing/pricing-calculator";

export async function calculatePrice(input: {
  deliveryType: "BICYCLE" | "MOTORBIKE" | "FOOT";
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  serviceType?: string;
  packageType: string;
  weight: number;
}) {
  return computePrice({
    pickupLat: input.pickupLat,
    pickupLng: input.pickupLng,
    deliveryLat: input.deliveryLat,
    deliveryLng: input.deliveryLng,
    deliveryType: input.deliveryType,
    serviceType: input.serviceType,
    packageType: input.packageType,
    weight: input.weight,
  });
}
