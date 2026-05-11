import http from "http";
import { io as Client, type Socket as ClientSocket } from "socket.io-client";
import app from "../../app";
import { createSocketServer } from "./live-tracking.socket";
import { loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";
import { createTestShipment, assignDriverToShipment } from "../../test/helpers/test-data.helper";
import { prisma } from "../../config/prisma";

let server: http.Server;
let port: number;
let driverToken: string;
let staffToken: string;
let driverUserId: string;
let driverId: string;
let shipmentId: string;

beforeAll(async () => {
  const driver = await loginAsDriver();
  driverToken = driver.token;
  driverUserId = driver.user.id;

  const driverProfile = await prisma.driver.findUnique({ where: { userId: driverUserId } });
  driverId = driverProfile!.id;

  const staff = await loginAsStaff();
  staffToken = staff.token;

  const created = await createTestShipment(staffToken, {
    deliveryType: "MOTORBIKE",
    pickupLat: 9.032,
    pickupLng: 38.747,
    deliveryLat: 9.005,
    deliveryLng: 38.763,
  });
  shipmentId = created.body.data.id;

  await assignDriverToShipment(staffToken, shipmentId, driverId);

  server = http.createServer(app);
  createSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const addr = server.address();
  if (addr && typeof addr === "object") {
    port = addr.port;
  }
});

afterAll(async () => {
  await prisma.routeSnapshot.deleteMany({ where: { shipmentId } });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

function connectAsDriver(): ClientSocket {
  return Client(`http://localhost:${port}`, {
    auth: { token: driverToken },
  });
}

function connectAsCustomer(): ClientSocket {
  return Client(`http://localhost:${port}`, {
    auth: { token: staffToken },
  });
}

describe("Live Tracking Socket", () => {
  describe("Authentication", () => {
    it("rejects connection without auth token", (done) => {
      const socket = Client(`http://localhost:${port}`);

      socket.on("connect_error", (err) => {
        expect(err.message).toContain("Authentication required");
        socket.close();
        done();
      });
    });

    it("accepts connection with valid driver token", (done) => {
      const socket = connectAsDriver();

      socket.on("connect", () => {
        expect(socket.connected).toBe(true);
        socket.close();
        done();
      });

      socket.on("connect_error", (err) => {
        done(new Error(`Connection failed: ${err.message}`));
      });
    });
  });

  describe("Driver start delivery", () => {
    it("computes route on driver:start-delivery", (done) => {
      const socket = connectAsDriver();

      socket.on("connect", () => {
        socket.emit("driver:start-delivery", { shipmentId });
      });

      socket.on("route:computed", (payload) => {
        expect(payload.shipmentId).toBe(shipmentId);
        expect(payload.distanceMeters).toBeGreaterThan(0);
        expect(payload.profile).toBe("driving");
        socket.close();
        done();
      });

      socket.on("error", (payload) => {
        done(new Error(`Unexpected error: ${payload.message}`));
      });
    });

    it("rejects start-delivery for nonexistent shipment", (done) => {
      const socket = connectAsDriver();

      socket.on("connect", () => {
        socket.emit("driver:start-delivery", { shipmentId: "does-not-exist" });
      });

      socket.on("error", (payload) => {
        expect(payload.message).toBe("Shipment not found");
        socket.close();
        done();
      });
    });
  });

  describe("Driver location updates", () => {
    it("updates driver position in database", (done) => {
      const socket = connectAsDriver();

      socket.on("connect", () => {
        socket.emit("driver:start-delivery", { shipmentId });
      });

      socket.on("route:computed", () => {
        socket.emit("driver:location", {
          lat: 9.015,
          lng: 38.755,
          heading: 90,
          speed: 10,
          timestamp: new Date().toISOString(),
        });

        setTimeout(async () => {
          const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
          expect(Number(driver!.currentLat)).toBeCloseTo(9.015, 2);
          expect(Number(driver!.currentLng)).toBeCloseTo(38.755, 2);
          socket.close();
          done();
        }, 300);
      });

      socket.on("error", (payload) => {
        done(new Error(`Unexpected error: ${payload.message}`));
      });
    });
  });

  describe("Customer tracking", () => {
    it("receives tracking:position when joined to shipment room", (done) => {
      const driverSocket = connectAsDriver();
      const customerSocket = connectAsCustomer();
      let driverReady = false;
      let customerReady = false;

      customerSocket.on("connect", () => {
        customerSocket.emit("join:shipment", shipmentId);
        customerReady = true;
        if (driverReady) emitLocation();
      });

      driverSocket.on("connect", () => {
        driverSocket.emit("driver:start-delivery", { shipmentId });
      });

      driverSocket.on("route:computed", () => {
        driverReady = true;
        if (customerReady) emitLocation();
      });

      function emitLocation() {
        driverSocket.emit("driver:location", {
          lat: 9.02,
          lng: 38.75,
          heading: 45,
          speed: 12,
          timestamp: new Date().toISOString(),
        });
      }

      customerSocket.on("tracking:position", (payload) => {
        expect(payload.lat).toBeCloseTo(9.02, 2);
        expect(payload.lng).toBeCloseTo(38.75, 2);
        expect(payload.heading).toBe(45);
        driverSocket.close();
        customerSocket.close();
        done();
      });

      customerSocket.on("connect_error", (err) => {
        done(new Error(`Customer connection failed: ${err.message}`));
      });

      driverSocket.on("error", (payload) => {
        done(new Error(`Driver error: ${payload.message}`));
      });
    });
  });
});
