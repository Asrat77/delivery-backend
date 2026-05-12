# Live Tracking API (Socket.IO)

Base URL: `http://localhost:4000` (same host/port as REST API)

## Connection

Authenticate by passing the JWT token in the handshake auth:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});
```

## Driver Events

Driver connects after logging in and receiving their JWT.

### driver:start-delivery

Start live tracking for a shipment. Computes the OSRM route and stores a route snapshot.

**Request:**
```json
{
  "shipmentId": "a5cede21-0ec1-487f-bdd5-7be0b232502a"
}
```

**Response — route:computed:**
```json
{
  "shipmentId": "a5cede21-0ec1-487f-bdd5-7be0b232502a",
  "distanceMeters": 4250,
  "durationSeconds": 720,
  "profile": "driving"
}
```

**Response — error (unassigned or not found):**
```json
{
  "message": "You are not assigned to this shipment"
}
```

---

### driver:location

Send GPS position every 3-5 seconds while navigating. Server updates the driver's position in the database and broadcasts to the customer's shipment room.

**Request:**
```json
{
  "lat": 9.032,
  "lng": 38.746,
  "heading": 135,
  "speed": 12.5,
  "timestamp": "2026-05-11T15:30:00.000Z"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `lat` | number | yes | Latitude (-90 to 90) |
| `lng` | number | yes | Longitude (-180 to 180) |
| `heading` | number | no | Compass direction in degrees (0-360) |
| `speed` | number | no | Speed in meters per second |
| `timestamp` | string | yes | ISO 8601 |

---

### driver:status-change

Notify the server and customer of a shipment status change.

**Request:**
```json
{
  "shipmentId": "a5cede21-0ec1-487f-bdd5-7be0b232502a",
  "status": "OUT_FOR_DELIVERY",
  "lat": 9.015,
  "lng": 38.755,
  "locationText": "Bole, near Edna Mall"
}
```

Valid status values: `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`

---

## Customer Events

Customer connects after logging in. Join a shipment room to receive real-time tracking.

### join:shipment

Join the tracking room for a specific shipment. Do this immediately after creating a shipment or when opening a tracking screen.

**Request:**
```json
"shipment-track-123"   // just the shipment ID as a string
```

**Response — error (shipment not found):**
```json
{
  "message": "Shipment not found"
}
```

---

### leave:shipment

Leave the tracking room. Do this when closing the tracking screen.

**Request:**
```json
"shipment-track-123"
```

---

## Customer — Incoming Events

Once joined to a shipment room, listen on these events.

### shipment:driver-assigned

Fires when staff assigns a driver to the shipment via the REST API.

**Payload:**
```json
{
  "shipmentId": "a5cede21-0ec1-487f-bdd5-7be0b232502a",
  "driverId": "drv_abc123",
  "driverName": "Tesfaye Alemu",
  "driverPhone": "+251911223344",
  "timestamp": "2026-05-11T15:25:00.000Z"
}
```

---

### tracking:position

Real-time driver location. Fires every 1-3 seconds while the driver is moving. Use `heading` to rotate the driver marker on the map.

**Payload:**
```json
{
  "lat": 9.032,
  "lng": 38.746,
  "heading": 135,
  "speed": 12.5,
  "timestamp": "2026-05-11T15:30:05.000Z"
}
```

---

### tracking:progress

Route progress update. Fires on every location update and when the driver deviates from the route.

**Payload:**
```json
{
  "shipmentId": "a5cede21-0ec1-487f-bdd5-7be0b232502a",
  "totalDistanceMeters": 4250,
  "distanceRemainingMeters": 2180,
  "totalDurationSeconds": 720,
  "durationRemainingSeconds": 370,
  "percentComplete": 49
}
```

| Field | Notes |
|-------|-------|
| `percentComplete` | 0-100. Good for progress bar. |
| `distanceRemainingMeters` | Rounded to nearest meter. |
| `durationRemainingSeconds` | Recalculated if driver deviates. |

---

### tracking:status

Fires when the driver changes shipment status.

**Payload:**
```json
{
  "shipmentId": "a5cede21-0ec1-487f-bdd5-7be0b232502a",
  "status": "OUT_FOR_DELIVERY",
  "locationText": "Bole, near Edna Mall",
  "timestamp": "2026-05-11T15:35:00.000Z"
}
```

---

### tracking:driver-online

Fires when the driver starts delivery or reconnects after being offline.

**Payload:**
```json
{}
```

---

### tracking:driver-offline

Fires 10 seconds after the driver stops sending location updates (lost connection, app backgrounded, etc.).

**Payload:**
```json
{
  "lastSeen": "2026-05-11T15:30:05.000Z"
}
```

---

## Complete Lifecycle

### Customer — from shipment creation to delivery

```
1. Customer creates shipment
   REST: POST /shipments
   Response: { success: true, data: { id: "ship_123", trackingNumber: "DLV-..." } }

2. Customer opens tracking screen
   Socket: connect with JWT
   Socket: emit "join:shipment" "ship_123"
   → Customer is now in the room — listening, but nothing fires yet.

3. Staff assigns driver
   REST: PATCH /shipments/ship_123/assign-driver { driverId: "drv_456" }
   ← Socket: receive "shipment:driver-assigned"
   App: show "Tesfaye is on the way" banner with driver photo

4. Driver starts delivery
   Socket: driver emits "driver:start-delivery" { shipmentId: "ship_123" }
   ← Socket: receive "tracking:driver-online"
   ← Socket: receive "tracking:progress" { percentComplete: 0, ... }
   App: show map with driver at pickup, ETA card

5. Driver is driving (repeats every 3-5s)
   Socket: driver emits "driver:location" { lat, lng, heading, speed, ... }
   ← Socket: receive "tracking:position" { lat, lng, heading, speed }
   ← Socket: receive "tracking:progress" { percentComplete: 35, ... }
   App: animate driver marker, update ETA

6. Driver loses signal
   (10s passes with no location updates)
   ← Socket: receive "tracking:driver-offline" { lastSeen }
   App: show "Driver lost signal" indicator

7. Driver reconnects
   Socket: driver emits "driver:location"
   ← Socket: receive "tracking:driver-online"
   App: remove offline indicator

8. Driver arrives
   Socket: driver emits "driver:status-change" { status: "OUT_FOR_DELIVERY" }
   ← Socket: receive "tracking:status" { status: "OUT_FOR_DELIVERY" }
   App: show status banner

9. Delivery complete
   REST: PUT /driver/update-status/ship_123 { status: "DELIVERED" }
   ← Socket: receive "tracking:status" { status: "DELIVERED" }
   App: show "Delivered" confirmation

10. Customer leaves tracking screen
    Socket: emit "leave:shipment" "ship_123"
    Socket: disconnect
```

### Driver — from login to delivery complete

```
1. Driver logs in
   REST: POST /auth/login + POST /auth/verify-login
   Save JWT token

2. Driver opens assigned shipments
   REST: GET /driver/shipments
   Show list of assigned shipments

3. Driver taps a shipment, picks it up
   REST: PUT /driver/update-status/ship_123 { status: "PICKED_UP" }

4. Driver taps "Start Navigation"
   Socket: connect with JWT
   Socket: emit "driver:start-delivery" { shipmentId: "ship_123" }
   ← Socket: receive "route:computed" { distanceMeters: 4250, durationSeconds: 720 }
   App: draw route on map

5. Driver drives (repeats every 3-5s)
   Socket: emit "driver:location" { lat, lng, heading, speed, timestamp }
   (no response — server broadcasts to customer silently)

6. Driver arrives
   Socket: emit "driver:status-change" { shipmentId, status: "OUT_FOR_DELIVERY" }

7. Driver completes delivery
   REST: PUT /driver/update-status/ship_123 { status: "DELIVERED" }

8. Driver ready for next
   Socket: emit "driver:start-delivery" { shipmentId: "ship_456" }
   (or disconnect if done)
```

## Dev Testing

Use the seeded driver account:

```
email: driver@example.com
password: Password123!
```

1. Login to get the JWT token
2. Connect via Socket.IO with `auth: { token: "<JWT>" }`
3. Create a shipment, assign the driver via REST
4. Emit `driver:start-delivery` with the shipment ID
5. Start emitting `driver:location` to simulate driving

The OSRM public router (`router.project-osrm.org`) is used by default. Set `OSRM_BASE_URL` env var for a self-hosted instance.
