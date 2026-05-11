// ── Socket event payloads ──

/** Driver sends this every 3-5 seconds while active */
export interface DriverLocationPayload {
  lat: number;
  lng: number;
  heading?: number;  // degrees, 0-360
  speed?: number;    // m/s
  timestamp: string; // ISO 8601
}

/** Driver starts a delivery — triggers OSRM route computation */
export interface DriverStartDeliveryPayload {
  shipmentId: string;
}

/** Driver changes shipment status (reuses existing status transition logic) */
export interface DriverStatusChangePayload {
  shipmentId: string;
  status: "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY";
  lat?: number;
  lng?: number;
  locationText?: string;
}

// ── Server → Customer events ──

export interface TrackingPositionPayload {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}

export interface TrackingProgressPayload {
  shipmentId: string;
  totalDistanceMeters: number;
  distanceRemainingMeters: number;
  totalDurationSeconds: number;
  durationRemainingSeconds: number;
  percentComplete: number; // 0-100
}

export interface TrackingStatusPayload {
  shipmentId: string;
  status: string;
  locationText: string | null;
  timestamp: string;
}

export interface TrackingDriverOfflinePayload {
  lastSeen: string; // ISO 8601
}

// ── Server → Driver events ──

export interface RouteComputedPayload {
  shipmentId: string;
  distanceMeters: number;
  durationSeconds: number;
  profile: string;
}

export interface ShipmentDriverAssignedPayload {
  shipmentId: string;
  driverId: string;
  driverName: string;
  driverPhone: string | null;
  timestamp: string;
}

// ── Socket authentication ──

export interface SocketAuth {
  token: string; // JWT Bearer token (without "Bearer " prefix)
}

// Augment Socket.IO types for typed socket instance
import type { AuthUser } from "../../utils/jwt";

declare module "socket.io" {
  interface Socket {
    user?: AuthUser;
  }
}

// ── Event map (for typed emit/listen) ──

export interface ClientToServerEvents {
  "driver:location": (payload: DriverLocationPayload) => void;
  "driver:start-delivery": (payload: DriverStartDeliveryPayload) => void;
  "driver:status-change": (payload: DriverStatusChangePayload) => void;
  "join:shipment": (shipmentId: string) => void;
  "leave:shipment": (shipmentId: string) => void;
}

export interface ServerToClientEvents {
  "tracking:position": (payload: TrackingPositionPayload) => void;
  "tracking:progress": (payload: TrackingProgressPayload) => void;
  "tracking:status": (payload: TrackingStatusPayload) => void;
  "tracking:driver-offline": (payload: TrackingDriverOfflinePayload) => void;
  "tracking:driver-online": () => void;
  "route:computed": (payload: RouteComputedPayload) => void;
  "shipment:driver-assigned": (payload: ShipmentDriverAssignedPayload) => void;
  "error": (payload: { message: string }) => void;
}
