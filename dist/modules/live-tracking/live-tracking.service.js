"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouteSnapshot = createRouteSnapshot;
exports.getRouteSnapshot = getRouteSnapshot;
exports.deleteRouteSnapshot = deleteRouteSnapshot;
exports.calculateProgress = calculateProgress;
exports.recalculateRouteFromPosition = recalculateRouteFromPosition;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const routing_service_1 = require("../routing/routing.service");
const DEVIATION_THRESHOLD_METERS = 50;
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function pointToSegmentDistanceMeters(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0)
        return haversineMeters(py, px, ay, ax);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const nearestLng = ax + t * dx;
    const nearestLat = ay + t * dy;
    return haversineMeters(py, px, nearestLat, nearestLng);
}
function distanceAlongLine(coords) {
    const distances = [0];
    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        distances.push(distances[i - 1] + haversineMeters(prev[1], prev[0], curr[1], curr[0]));
    }
    return distances;
}
async function createRouteSnapshot(input) {
    const route = await (0, routing_service_1.getRouteWithGeometry)({
        pickupLng: input.pickupLng,
        pickupLat: input.pickupLat,
        deliveryLng: input.deliveryLng,
        deliveryLat: input.deliveryLat,
        deliveryType: input.deliveryType,
    });
    return prisma_1.prisma.routeSnapshot.upsert({
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
async function getRouteSnapshot(shipmentId) {
    return prisma_1.prisma.routeSnapshot.findUnique({ where: { shipmentId } });
}
async function deleteRouteSnapshot(shipmentId) {
    await prisma_1.prisma.routeSnapshot.deleteMany({ where: { shipmentId } });
}
async function calculateProgress(shipmentId, currentLat, currentLng) {
    const snapshot = await getRouteSnapshot(shipmentId);
    if (!snapshot) {
        throw new ApiError_1.ApiError(404, "No route snapshot found for this shipment");
    }
    const geometry = snapshot.geometry;
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
        const dist = pointToSegmentDistanceMeters(currentLng, currentLat, a[0], a[1], b[0], b[1]);
        if (dist < minDistance) {
            minDistance = dist;
            nearestSegmentIndex = i;
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const lenSq = dx * dx + dy * dy;
            if (lenSq > 0) {
                nearestFraction = Math.max(0, Math.min(1, ((currentLng - a[0]) * dx + (currentLat - a[1]) * dy) / lenSq));
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
    const durationRemainingSeconds = Math.round(snapshot.duration * (1 - fractionComplete));
    return {
        totalDistanceMeters: Math.round(totalDistanceMeters),
        distanceRemainingMeters: Math.round(distanceRemainingMeters),
        totalDurationSeconds: snapshot.duration,
        durationRemainingSeconds: Math.max(0, durationRemainingSeconds),
        percentComplete: Math.round(Math.min(100, fractionComplete * 100)),
        isDeviated,
    };
}
async function recalculateRouteFromPosition(input) {
    const route = await (0, routing_service_1.getRouteWithGeometry)({
        pickupLng: input.currentLng,
        pickupLat: input.currentLat,
        deliveryLng: input.deliveryLng,
        deliveryLat: input.deliveryLat,
        deliveryType: input.deliveryType,
    });
    const snapshot = await prisma_1.prisma.routeSnapshot.upsert({
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
    const progress = {
        totalDistanceMeters: route.distanceMeters,
        distanceRemainingMeters: route.distanceMeters,
        totalDurationSeconds: route.durationSeconds,
        durationRemainingSeconds: route.durationSeconds,
        percentComplete: 0,
        isDeviated: false,
    };
    return { snapshot, progress };
}
