import type { ShipmentStatus } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";

const transitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function assertValidTransition(from: ShipmentStatus, to: ShipmentStatus) {
  if (!transitions[from].includes(to)) {
    throw new ApiError(400, `Invalid status transition: ${from} -> ${to}`);
  }
}

