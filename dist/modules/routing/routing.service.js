"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteDistance = getRouteDistance;
const env_1 = require("../../config/env");
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
}
const DELIVERY_TO_PROFILE = {
    MOTORBIKE: "driving",
    BICYCLE: "cycling",
    FOOT: "foot",
};
async function getRouteDistance(input) {
    const profile = DELIVERY_TO_PROFILE[input.deliveryType];
    const osrmBase = (0, env_1.getEnv)().OSRM_BASE_URL || "https://router.project-osrm.org";
    const url = `${osrmBase}/route/v1/${profile}/${input.pickupLng},${input.pickupLat};${input.deliveryLng},${input.deliveryLat}?overview=false`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok)
            throw new Error(`OSRM HTTP ${res.status}`);
        const data = await res.json();
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
    }
    catch {
        return haversineFallback(input.pickupLat, input.pickupLng, input.deliveryLat, input.deliveryLng);
    }
}
function haversineFallback(lat1, lng1, lat2, lng2) {
    const km = haversineDistance(lat1, lng1, lat2, lng2);
    return {
        distanceMeters: Math.round(km * 1000),
        distanceKm: km,
        durationSeconds: null,
        via: "haversine",
    };
}
