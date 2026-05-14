import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { verifyToken } from "../../utils/jwt";
import { prisma } from "../../config/prisma";
import * as service from "./live-tracking.service";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketAuth,
  DriverLocationPayload,
  DriverStartDeliveryPayload,
  DriverStatusChangePayload,
} from "./live-tracking.types";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

const DRIVER_OFFLINE_GRACE_MS = 10_000;
const BROADCAST_THROTTLE_MS = 1_000;

const driverLastSeen = new Map<string, number>();
const driverOfflineTimers = new Map<string, ReturnType<typeof setTimeout>>();
const shipmentActiveDriver = new Map<string, string>();

let io: TypedServer | null = null;

export function getIO(): TypedServer {
  if (!io)
    throw new Error(
      "Socket.IO not initialized. Call createSocketServer first.",
    );
  return io;
}

export function createSocketServer(httpServer: HttpServer): TypedServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: true, credentials: true },
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  io!.use(async (socket, next) => {
    try {
      const { token } = (socket.handshake.auth as SocketAuth) || {};
      if (!token) return next(new Error("Authentication required"));

      socket.user = await verifyToken(token);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io!.on("connection", (socket: TypedSocket) => {
    const userId = socket.user!.id;
    const role = socket.user!.role;

    if (role === "DRIVER") {
      setupDriverSocket(io!, socket, userId);
    }

    socket.on("join:shipment", async (shipmentId: string) => {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        select: { id: true },
      });
      if (!shipment) {
        socket.emit("error", { message: "Shipment not found" });
        return;
      }

      await socket.join(`shipment:${shipmentId}`);
    });

    socket.on("leave:shipment", async (shipmentId: string) => {
      await socket.leave(`shipment:${shipmentId}`);
    });

    socket.on("disconnect", () => {
      const activeShipmentId = shipmentActiveDriver.get(userId);
      if (activeShipmentId) {
        const offlineTimer = setTimeout(() => {
          io!
            .to(`shipment:${activeShipmentId}`)
            .emit("tracking:driver-offline", {
              lastSeen: new Date(
                Date.now() - DRIVER_OFFLINE_GRACE_MS,
              ).toISOString(),
            });
          driverOfflineTimers.delete(userId);
        }, DRIVER_OFFLINE_GRACE_MS);

        driverOfflineTimers.set(userId, offlineTimer);
      }
    });
  });

  return io;
}

function setupDriverSocket(
  io: TypedServer,
  socket: TypedSocket,
  userId: string,
) {
  const broadcastTimestamps = new Map<string, number>();

  socket.join(`driver:${userId}`);

  socket.on("driver:location", async (payload: DriverLocationPayload) => {
    const now = Date.now();
    driverLastSeen.set(userId, now);

    const offlineTimer = driverOfflineTimers.get(userId);
    if (offlineTimer) {
      clearTimeout(offlineTimer);
      driverOfflineTimers.delete(userId);
    }

    await prisma.driver.updateMany({
      where: { userId },
      data: { currentLat: payload.lat, currentLng: payload.lng },
    });

    const activeShipmentId = shipmentActiveDriver.get(userId);
    if (!activeShipmentId) return;

    const lastBroadcast = broadcastTimestamps.get(activeShipmentId) ?? 0;
    if (now - lastBroadcast < BROADCAST_THROTTLE_MS) return;
    broadcastTimestamps.set(activeShipmentId, now);

    io.to(`shipment:${activeShipmentId}`).emit("tracking:position", {
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading ?? null,
      speed: payload.speed ?? null,
      timestamp: payload.timestamp,
    });

    try {
      const progress = await service.calculateProgress(
        activeShipmentId,
        payload.lat,
        payload.lng,
      );

      if (progress.isDeviated) {
        const shipment = await prisma.shipment.findUnique({
          where: { id: activeShipmentId },
          select: { deliveryLat: true, deliveryLng: true, deliveryType: true },
        });
        if (shipment) {
          const result = await service.recalculateRouteFromPosition({
            shipmentId: activeShipmentId,
            currentLat: payload.lat,
            currentLng: payload.lng,
            deliveryLat: Number(shipment.deliveryLat),
            deliveryLng: Number(shipment.deliveryLng),
            deliveryType: shipment.deliveryType,
          });

          io.to(`shipment:${activeShipmentId}`).emit("tracking:progress", {
            shipmentId: activeShipmentId,
            totalDistanceMeters: result.progress.totalDistanceMeters,
            distanceRemainingMeters: result.progress.distanceRemainingMeters,
            totalDurationSeconds: result.progress.totalDurationSeconds,
            durationRemainingSeconds: result.progress.durationRemainingSeconds,
            percentComplete: result.progress.percentComplete,
          });

          socket.emit("route:computed", {
            shipmentId: activeShipmentId,
            distanceMeters: result.snapshot.distance,
            durationSeconds: result.snapshot.duration,
            profile: result.snapshot.profile,
          });
        }
      } else {
        io.to(`shipment:${activeShipmentId}`).emit("tracking:progress", {
          shipmentId: activeShipmentId,
          totalDistanceMeters: progress.totalDistanceMeters,
          distanceRemainingMeters: progress.distanceRemainingMeters,
          totalDurationSeconds: progress.totalDurationSeconds,
          durationRemainingSeconds: progress.durationRemainingSeconds,
          percentComplete: progress.percentComplete,
        });
      }
    } catch {
      // Shipment may not have a route snapshot yet — silently skip progress
    }
  });

  socket.on(
    "driver:start-delivery",
    async (payload: DriverStartDeliveryPayload) => {
      const shipment = await prisma.shipment.findUnique({
        where: { id: payload.shipmentId },
        select: {
          id: true,
          pickupLat: true,
          pickupLng: true,
          deliveryLat: true,
          deliveryLng: true,
          deliveryType: true,
          assignedDriverId: true,
        },
      });

      if (!shipment) {
        socket.emit("error", { message: "Shipment not found" });
        return;
      }

      const driver = await prisma.driver.findUnique({ where: { userId } });
      if (!driver || shipment.assignedDriverId !== driver.id) {
        socket.emit("error", {
          message: "You are not assigned to this shipment",
        });
        return;
      }

      shipmentActiveDriver.set(userId, payload.shipmentId);

      try {
        const snapshot = await service.createRouteSnapshot({
          shipmentId: shipment.id,
          pickupLng: Number(shipment.pickupLng),
          pickupLat: Number(shipment.pickupLat),
          deliveryLng: Number(shipment.deliveryLng),
          deliveryLat: Number(shipment.deliveryLat),
          deliveryType: shipment.deliveryType,
        });

        socket.emit("route:computed", {
          shipmentId: shipment.id,
          distanceMeters: snapshot.distance,
          durationSeconds: snapshot.duration,
          profile: snapshot.profile,
        });

        io.to(`shipment:${payload.shipmentId}`).emit("tracking:progress", {
          shipmentId: shipment.id,
          totalDistanceMeters: snapshot.distance,
          distanceRemainingMeters: snapshot.distance,
          totalDurationSeconds: snapshot.duration,
          durationRemainingSeconds: snapshot.duration,
          percentComplete: 0,
        });

        io.to(`shipment:${payload.shipmentId}`).emit("tracking:driver-online");
      } catch (err) {
        socket.emit("error", {
          message:
            err instanceof Error ? err.message : "Failed to compute route",
        });
      }
    },
  );

  socket.on(
    "driver:status-change",
    async (payload: DriverStatusChangePayload) => {
      const driver = await prisma.driver.findUnique({ where: { userId } });
      if (!driver) return;

      const shipment = await prisma.shipment.findUnique({
        where: { id: payload.shipmentId },
        select: { assignedDriverId: true, status: true },
      });

      if (!shipment || shipment.assignedDriverId !== driver.id) {
        socket.emit("error", { message: "Not assigned to this shipment" });
        return;
      }

      io.to(`shipment:${payload.shipmentId}`).emit("tracking:status", {
        shipmentId: payload.shipmentId,
        status: payload.status,
        locationText: payload.locationText ?? null,
        timestamp: new Date().toISOString(),
      });

      if (payload.lat !== undefined && payload.lng !== undefined) {
        io.to(`shipment:${payload.shipmentId}`).emit("tracking:position", {
          lat: payload.lat,
          lng: payload.lng,
          heading: null,
          speed: null,
          timestamp: new Date().toISOString(),
        });
      }
    },
  );
}
