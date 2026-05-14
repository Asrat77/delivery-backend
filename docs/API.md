# Logistics Backend API (for Postman + Frontend Integration)

Base URL (dev): `http://localhost:4000`

Important: routes are mounted **without** an `/api` prefix.

## Response format

Success:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "string",
  "statusCode": 400,
  "details": null
}
```

Validation errors return `422` with `details` in Zod format.

## Auth

Most routes require:

- Header: `Authorization: Bearer <JWT>`

JWT is issued by `/auth/login` (and `/auth/register`).

### Seeded users (dev)

Password for all seeded users: `Password123!`

- Admin: `admin@example.com` or `+251900000001`
- Staff: `staff@example.com` or `+251900000002`
- Driver: `driver@example.com` or `+251900000003`
- Customer: `customer@example.com` or `+251900000004`

## Pagination

Many list endpoints accept:

- Query: `page` (default `1`, min `1`)
- Query: `limit` (default `20`, min `1`, max `100`)

Responses are typically:

```json
{ "items": [], "page": 1, "limit": 20, "total": 0 }
```

## Quick Postman setup

Suggested Postman variables:

- `baseUrl` = `http://localhost:4000`
- `token` = `<paste JWT from login response>`

For protected routes add header:

- `Authorization: Bearer {{token}}`

---

## Health

### `GET /health`

Auth: none

Example:

- `GET {{baseUrl}}/health`

---

## Auth (`/auth`)

### `POST /auth/register`

Auth: none  
Creates a **CUSTOMER** user.

Body:

```json
{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "phone": "+251911111111",
  "password": "Password123!"
}
```

Response `201` (`data.token` + `data.user`).

### `POST /auth/login`

Auth: none

Body:

```json
{
  "emailOrPhone": "admin@example.com",
  "password": "Password123!"
}
```

- **Admin users**: returns `200` with `data.token` + `data.user` directly (OTP skipped).
- **Non-admin users** (STAFF, DRIVER, CUSTOMER): returns `200` with `data.phone` — then call `/auth/verify-login` to get the token.

### `POST /auth/verify-login`

Auth: none  
Verifies the OTP sent by `/auth/login` for non-admin users.

Body:

```json
{
  "phone": "+251900000002",
  "otp": "12345"
}
```

Response `200` (`data.token` + `data.user`).

### `GET /auth/me`

Auth: required

Example:

- `GET {{baseUrl}}/auth/me`
- Header: `Authorization: Bearer {{token}}`

---

## Users (`/users`) — ADMIN only

All `/users/*` endpoints require an **ADMIN** token.

### `POST /users`

Body:

```json
{
  "name": "New Staff",
  "email": "new.staff@example.com",
  "phone": "+251922222222",
  "password": "Password123!",
  "role": "STAFF",
  "status": "ACTIVE"
}
```

Notes:

- `email` is optional.
- If `role` is `DRIVER`, a driver profile is created automatically.

### `GET /users`

Query:

- `page`, `limit`
- optional `role`: `ADMIN | STAFF | DRIVER | CUSTOMER`
- optional `status`: `ACTIVE | INACTIVE`

Example:

- `GET {{baseUrl}}/users?page=1&limit=20&role=DRIVER`

### `GET /users/:id`

Params:

- `id` (uuid)

### `PATCH /users/:id/status`

Body:

```json
{ "status": "INACTIVE" }
```

### `PATCH /users/:id/role`

Body:

```json
{ "role": "DRIVER" }
```

---

## Drivers (`/drivers`) — ADMIN, STAFF

All `/drivers/*` endpoints require **ADMIN** or **STAFF**.

### `GET /drivers`

Query:

- `page`, `limit`
- optional `isAvailable`: `true | false` (string)

Example:

- `GET {{baseUrl}}/drivers?isAvailable=true`

### `GET /drivers/:id`

Params:

- `id` (uuid) — driver id (not user id)

---

## Driver self-service (`/driver`) — DRIVER only

All `/driver/*` endpoints require a **DRIVER** token.

### `GET /driver/shipments`

Returns shipments assigned to the driver, including events.

Example:

- `GET {{baseUrl}}/driver/shipments`

### `PUT /driver/update-location`

Body:

```json
{ "lat": 9.03, "lng": 38.74 }
```

### `PUT /driver/update-status/:shipmentId`

Params:

- `shipmentId` (uuid)

Body:

```json
{
  "status": "IN_TRANSIT",
  "locationText": "Bole, Addis Ababa",
  "lat": 9.01,
  "lng": 38.76
}
```

Allowed `status` values here:

- `PICKED_UP | IN_TRANSIT | OUT_FOR_DELIVERY`

---

## Shipments (`/shipments`)

All `/shipments/*` endpoints require auth.

Roles:

- Create: `ADMIN | STAFF | CUSTOMER`
- List / Get: `ADMIN | STAFF | CUSTOMER`
- Drivers must use `/driver/shipments` (server returns `403` if a driver calls `GET /shipments`)
- Assign driver: `ADMIN | STAFF`
- Update shipment status: `ADMIN | STAFF`

### `POST /shipments`

Body:

```json
{
  "senderName": "Alice",
  "senderPhone": "+251900000004",
  "receiverName": "Bob",
  "receiverPhone": "+251900000003",
  "pickupAddress": "Addis Ababa, Kazanchis",
  "deliveryAddress": "Addis Ababa, Bole",
  "packageType": "DOCUMENT",
  "weight": 2.5,
  "paymentMethod": "CASH",
  "codAmount": 100
}
```

Optional fields:

- `pickupLat`, `pickupLng`, `deliveryLat`, `deliveryLng`
- `price` (if omitted, backend tries to compute price from active pricing rules)
- `codAmount` (if `> 0`, creates a COD transaction)

Notes:

- On create, an OTP proof is created. In `NODE_ENV=development`, response includes `data.devOtp` (for testing).

### `GET /shipments`

Query:

- `page`, `limit`
- optional `status`: `CREATED | PICKED_UP | IN_TRANSIT | OUT_FOR_DELIVERY | DELIVERED | CANCELLED`
- optional `assignedDriverId` (uuid)
- optional `trackingNumber` (string, partial)
- optional `senderPhone` (string, partial)
- optional `receiverPhone` (string, partial)
- optional `dateFrom` / `dateTo` (ISO datetime strings)

Example:

- `GET {{baseUrl}}/shipments?status=CREATED&page=1&limit=20`

### `GET /shipments/:id`

Params:

- `id` (uuid)

Notes:

- Customers can only access shipments they created.
- Drivers can only access shipments assigned to them (but drivers normally use `/driver/*`).

### `PATCH /shipments/:id/assign-driver`

Role: `ADMIN | STAFF`

Body:

```json
{ "driverId": "<driverId-uuid>" }
```

### `PATCH /shipments/:id/status`

Role: `ADMIN | STAFF`

Body:

```json
{ "status": "OUT_FOR_DELIVERY" }
```

Status transitions (enforced):

- `CREATED -> PICKED_UP | CANCELLED`
- `PICKED_UP -> IN_TRANSIT | CANCELLED`
- `IN_TRANSIT -> OUT_FOR_DELIVERY | CANCELLED`
- `OUT_FOR_DELIVERY -> DELIVERED | CANCELLED`

Delivery rules:

- To set `DELIVERED`, OTP must be verified (`POST /shipments/:id/verify-otp`)
- If shipment has COD, COD must be collected before delivery (`PATCH /cod/:shipmentId/mark-collected`)

### `GET /shipments/:id/qr`

Returns:

```json
{ "dataUrl": "data:image/png;base64,..." }
```

The QR code encodes: `APP_PUBLIC_URL/track/<trackingNumber>`.

### `POST /shipments/:id/verify-otp`

Body:

```json
{ "otp": "123456" }
```

Notes:

- OTP is 6 digits.
- If `otpExpiresAt` has passed, returns `400` ("OTP expired").

---

## Tracking (`/track`)

### `GET /track/:trackingNumber`

Auth: none

Params:

- `trackingNumber` (min length 3)

Returns shipment summary + `events` list and `latestEvent`.

Example:

- `GET {{baseUrl}}/track/TRK-ABC123`

---

## Payments (`/payments`)

All `/payments/*` endpoints require auth.

Access rules:

- Customers can only access payments for shipments they created.
- Drivers cannot access payments (`403`).

### `GET /payments/:shipmentId`

Params:

- `shipmentId` (uuid)

### `PATCH /payments/:shipmentId/mark-paid`

Role: `ADMIN | STAFF`

Body:

```json
{ "providerReference": "telebirr-tx-123" }
```

---

## COD (`/cod`)

All `/cod/*` endpoints require auth.

Access rules:

- Customers: only their own shipments’ COD
- Driver: only if shipment is assigned to them
- Admin/Staff: allowed

### `GET /cod/:shipmentId`

Params:

- `shipmentId` (uuid)

### `PATCH /cod/:shipmentId/mark-collected`

Body: empty object or omitted

Example body:

```json
{}
```

Notes:

- If called by a driver, it records which driver collected.

---

## Pricing (`/pricing`) — ADMIN only

All `/pricing/*` endpoints require an **ADMIN** token.

### `POST /pricing`

Body (FIXED example):

```json
{
  "name": "Docs (fixed)",
  "type": "FIXED",
  "packageType": "DOCUMENT",
  "fixedPrice": 50
}
```

Body (PER_KG example):

```json
{
  "name": "General (per kg)",
  "type": "PER_KG",
  "pricePerKg": 30,
  "minWeight": 0.1,
  "maxWeight": 25
}
```

Rules:

- If `type=FIXED`, `fixedPrice` is required.
- If `type=PER_KG`, `pricePerKg` is required.

### `GET /pricing`

Query:

- `page`, `limit`
- optional `isActive`: `true | false` (string)

### `GET /pricing/:id`

Params:

- `id` (uuid)

### `PATCH /pricing/:id`

Body: any subset of fields accepted by create.

### `PATCH /pricing/:id/status`

Body:

```json
{ "isActive": true }
```

### `DELETE /pricing/:id`

---

## Integrations (`/integrations`) — ADMIN, STAFF

All `/integrations/*` endpoints require **ADMIN** or **STAFF**.

Note: this project currently provides a **mock DHL provider** (no real network calls).

### `GET /integrations/providers`

### `POST /integrations/dhl/quote`

Body:

```json
{ "weight": 2.5, "from": "ADDIS", "to": "ADAMA" }
```

### `POST /integrations/dhl/create-shipment`

Body:

```json
{ "shipmentId": "<shipmentId-uuid>" }
```

---

## Reports (`/reports`) — ADMIN, STAFF

All `/reports/*` endpoints require **ADMIN** or **STAFF**.

### `GET /reports/summary`

Returns counts + sums (revenue, COD totals).

### `GET /reports/shipments-by-status`

### `GET /reports/payments`

### `GET /reports/cod`

### `GET /reports/driver-performance`

