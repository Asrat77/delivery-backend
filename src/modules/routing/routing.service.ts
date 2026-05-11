import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

type LineString = {
  type: "LineString";
  coordinates: [number, number][];
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

const DELIVERY_TO_PROFILE: Record<string, string> = {
  MOTORBIKE: "driving",
  BICYCLE: "cycling",
  FOOT: "foot",
};

export type RouteResult = {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number | null;
  via: "osrm" | "haversine";
};

export type RouteGeometryResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: LineString;
  profile: string;
  via: "osrm" | "haversine";
};

export async function getRouteDistance(input: {
  pickupLng: number;
  pickupLat: number;
  deliveryLng: number;
  deliveryLat: number;
  deliveryType: "MOTORBIKE" | "BICYCLE" | "FOOT";
}): Promise<RouteResult> {
  const profile = DELIVERY_TO_PROFILE[input.deliveryType];
  const osrmBase = getEnv().OSRM_BASE_URL || "https://router.project-osrm.org";
  const url = `${osrmBase}/route/v1/${profile}/${input.pickupLng},${input.pickupLat};${input.deliveryLng},${input.deliveryLat}?overview=false`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json() as { code: string; routes?: Array<{ distance: number; duration: number }> };

    if (data.code !== "Ok" || !data.routes?.[0]) {
      return haversineFallback(input.pickupLat, input.pickupLng, input.deliveryLat, input.deliveryLng);
    }

    const route = data.routes[0];
    return {
      distanceMeters: Math.round(route.distance),
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationSeconds: Math.round(route.duration),
      via: "osrm",
    };
  } catch {
    return haversineFallback(input.pickupLat, input.pickupLng, input.deliveryLat, input.deliveryLng);
  }
}

export async function getRouteWithGeometry(input: {
  pickupLng: number;
  pickupLat: number;
  deliveryLng: number;
  deliveryLat: number;
  deliveryType: "MOTORBIKE" | "BICYCLE" | "FOOT";
}): Promise<RouteGeometryResult> {
  const profile = DELIVERY_TO_PROFILE[input.deliveryType];
  const osrmBase = getEnv().OSRM_BASE_URL || "https://router.project-osrm.org";
  const url = `${osrmBase}/route/v1/${profile}/${input.pickupLng},${input.pickupLat};${input.deliveryLng},${input.deliveryLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json() as {
      code: string;
      routes?: Array<{ distance: number; duration: number; geometry: LineString }>;
    };

    if (data.code !== "Ok" || !data.routes?.[0] || !data.routes[0].geometry) {
      throw new Error("OSRM returned no geometry");
    }

    const route = data.routes[0];
    return {
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      geometry: route.geometry,
      profile,
      via: "osrm",
    };
  } catch {
    const km = haversineDistance(input.pickupLat, input.pickupLng, input.deliveryLat, input.deliveryLng);
    return {
      distanceMeters: Math.round(km * 1000),
      durationSeconds: 0,
      geometry: {
        type: "LineString",
        coordinates: [
          [input.pickupLng, input.pickupLat],
          [input.deliveryLng, input.deliveryLat],
        ],
      },
      profile,
      via: "haversine",
    };
  }
}

function haversineFallback(lat1: number, lng1: number, lat2: number, lng2: number): RouteResult {
  const km = haversineDistance(lat1, lng1, lat2, lng2);
  return {
    distanceMeters: Math.round(km * 1000),
    distanceKm: km,
    durationSeconds: null,
    via: "haversine",
  };
}
