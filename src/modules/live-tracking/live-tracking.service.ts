import type { RouteSnapshot } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { getRouteWithGeometry, type RouteGeometryResult } from "../routing/routing.service";

const DEVIATION_THRESHOLD_METERS = 50;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistanceMeters(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineMeters(py, px, ay, ax);

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const nearestLng = ax + t * dx;
  const nearestLat = ay + t * dy;
  return haversineMeters(py, px, nearestLat, nearestLng);
}

function distanceAlongLine(coords: [number, number][]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    distances.push(
      distances[i - 1] + haversineMeters(prev[1], prev[0], curr[1], curr[0]),
    );
  }
  return distances;
}

export type ProgressResult = {
  totalDistanceMeters: number;
  distanceRemainingMeters: number;
  totalDurationSeconds: number;
  durationRemainingSeconds: number;
  percentComplete: number;
  isDeviated: boolean;
};

export async function createRouteSnapshot(input: {
  shipmentId: string;
  pickupLng: number;
  pickupLat: number;
  deliveryLng: number;
  deliveryLat: number;
  deliveryType: "MOTORBIKE" | "BICYCLE" | "FOOT";
}): Promise<RouteSnapshot> {
  const route = await getRouteWithGeometry({
    pickupLng: input.pickupLng,
    pickupLat: input.pickupLat,
    deliveryLng: input.deliveryLng,
    deliveryLat: input.deliveryLat,
    deliveryType: input.deliveryType,
  });

  return prisma.routeSnapshot.upsert({
    where: { shipmentId: input.shipmentId },
    create: {
      shipmentId: input.shipmentId,
      geometry: route.geometry,
      distance: route.distanceMeters,
      duration: route.durationSeconds,
      profile: route.profile,
    },
    update: {
      geometry: route.geometry,
      distance: route.distanceMeters,
      duration: route.durationSeconds,
      profile: route.profile,
    },
  });
}

export async function getRouteSnapshot(shipmentId: string): Promise<RouteSnapshot | null> {
  return prisma.routeSnapshot.findUnique({ where: { shipmentId } });
}

export async function deleteRouteSnapshot(shipmentId: string): Promise<void> {
  await prisma.routeSnapshot.deleteMany({ where: { shipmentId } });
}

export async function calculateProgress(
  shipmentId: string,
  currentLat: number,
  currentLng: number,
): Promise<ProgressResult> {
  const snapshot = await getRouteSnapshot(shipmentId);
  if (!snapshot) {
    throw new ApiError(404, "No route snapshot found for this shipment");
  }

  const geometry = snapshot.geometry as { type: string; coordinates: [number, number][] };
  const coords = geometry.coordinates;

  if (coords.length < 2) {
    return {
      totalDistanceMeters: snapshot.distance,
      distanceRemainingMeters: snapshot.distance,
      totalDurationSeconds: snapshot.duration,
      durationRemainingSeconds: snapshot.duration,
      percentComplete: 0,
      isDeviated: false,
    };
  }

  const cumulativeDistances = distanceAlongLine(coords);
  const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1];

  let minDistance = Infinity;
  let nearestSegmentIndex = 0;
  let nearestFraction = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const dist = pointToSegmentDistanceMeters(
      currentLng, currentLat,
      a[0], a[1],
      b[0], b[1],
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearestSegmentIndex = i;

      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const lenSq = dx * dx + dy * dy;
      if (lenSq > 0) {
        nearestFraction = Math.max(0, Math.min(1,
          ((currentLng - a[0]) * dx + (currentLat - a[1]) * dy) / lenSq,
        ));
      }
    }
  }

  const isDeviated = minDistance > DEVIATION_THRESHOLD_METERS;

  const distanceToNearest = cumulativeDistances[nearestSegmentIndex] +
    nearestFraction *
    (cumulativeDistances[nearestSegmentIndex + 1] - cumulativeDistances[nearestSegmentIndex]);

  const distanceRemainingMeters = Math.max(0, totalDistanceMeters - distanceToNearest);

  const fractionComplete = totalDistanceMeters > 0
    ? distanceToNearest / totalDistanceMeters
    : 0;

  const durationRemainingSeconds = Math.round(
    snapshot.duration * (1 - fractionComplete),
  );

  return {
    totalDistanceMeters: Math.round(totalDistanceMeters),
    distanceRemainingMeters: Math.round(distanceRemainingMeters),
    totalDurationSeconds: snapshot.duration,
    durationRemainingSeconds: Math.max(0, durationRemainingSeconds),
    percentComplete: Math.round(Math.min(100, fractionComplete * 100)),
    isDeviated,
  };
}

export async function recalculateRouteFromPosition(input: {
  shipmentId: string;
  currentLat: number;
  currentLng: number;
  deliveryLat: number;
  deliveryLng: number;
  deliveryType: "MOTORBIKE" | "BICYCLE" | "FOOT";
}): Promise<{ snapshot: RouteSnapshot; progress: ProgressResult }> {
  const route = await getRouteWithGeometry({
    pickupLng: input.currentLng,
    pickupLat: input.currentLat,
    deliveryLng: input.deliveryLng,
    deliveryLat: input.deliveryLat,
    deliveryType: input.deliveryType,
  });

  const snapshot = await prisma.routeSnapshot.upsert({
    where: { shipmentId: input.shipmentId },
    create: {
      shipmentId: input.shipmentId,
      geometry: route.geometry,
      distance: route.distanceMeters,
      duration: route.durationSeconds,
      profile: route.profile,
    },
    update: {
      geometry: route.geometry,
      distance: route.distanceMeters,
      duration: route.durationSeconds,
      profile: route.profile,
    },
  });

  const progress: ProgressResult = {
    totalDistanceMeters: route.distanceMeters,
    distanceRemainingMeters: route.distanceMeters,
    totalDurationSeconds: route.durationSeconds,
    durationRemainingSeconds: route.durationSeconds,
    percentComplete: 0,
    isDeviated: false,
  };

  return { snapshot, progress };
}
