import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";
import { assignDriverToShipment, collectCod, createTestShipment, markPaymentPaid, verifyShipmentOtp } from "../../test/helpers/test-data.helper";

describe("SHIPMENTS", () => {
  it("Admin/staff can create shipment", async () => {
    const { token } = await loginAsStaff();
    const res = await createTestShipment(token);
    expect(res.status).toBe(201);
  });

  it("Shipment creation generates trackingNumber", async () => {
    const { token } = await loginAsStaff();
    const res = await createTestShipment(token);
    expect(res.body.data.trackingNumber).toBeTruthy();
  });

  it("Shipment creation creates initial CREATED event", async () => {
    const { token } = await loginAsStaff();
    const res = await createTestShipment(token);
    const shipmentId = res.body.data.id as string;
    const events = await prisma.shipmentEvent.findMany({ where: { shipmentId }, orderBy: { timestamp: "asc" } });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].status).toBe("CREATED");
  });

  it("Shipment creation creates payment row", async () => {
    const { token } = await loginAsStaff();
    const res = await createTestShipment(token);
    expect(res.body.data.payment).toBeTruthy();
  });

  it("Shipment creation creates COD row always (defaults to computed price)", async () => {
    const { token } = await loginAsStaff();
    const noCod = await createTestShipment(token, { codAmount: undefined });
    expect(noCod.body.data.codTransaction).toBeTruthy();
    expect(noCod.body.data.codTransaction.amount).toBeTruthy();

    const withCod = await createTestShipment(token, { codAmount: 100 });
    expect(withCod.body.data.codTransaction).toBeTruthy();
    expect(withCod.body.data.codTransaction.amount).toBe("100");
  });

  it("Shipment creation creates delivery proof OTP", async () => {
    const { token } = await loginAsStaff();
    const res = await createTestShipment(token);
    expect(res.body.data.deliveryProof).toBeTruthy();
    expect(res.body.data.deliveryProof.otpExpiresAt).toBeTruthy();
    expect(res.body.data.deliveryProof.otpCodeHash).toBeUndefined();
  });

  it("Staff/admin can assign driver using PATCH /shipments/:id/assign-driver", async () => {
    const { token: staffToken } = await loginAsStaff();
    const { user: driverUser } = await loginAsDriver();
    const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
    expect(driver).toBeTruthy();

    const created = await createTestShipment(staffToken);
    const shipmentId = created.body.data.id as string;

    const res = await assignDriverToShipment(staffToken, shipmentId, driver!.id);
    expect(res.status).toBe(200);
    expect(res.body.data.assignedDriverId).toBe(driver!.id);
  });

  it("Status transition CREATED -> PICKED_UP works", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const shipmentId = created.body.data.id as string;

    const res = await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "PICKED_UP" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PICKED_UP");
  });

  it("Invalid transition CREATED -> DELIVERED is rejected", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const shipmentId = created.body.data.id as string;

    const res = await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "DELIVERED" });
    expect(res.status).toBe(400);
  });

  it("Shipment cannot become DELIVERED without verified OTP", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const shipmentId = created.body.data.id as string;

    await request(app).patch(`/shipments/${shipmentId}/status`).set("Authorization", `Bearer ${token}`).send({ status: "PICKED_UP" });
    await request(app).patch(`/shipments/${shipmentId}/status`).set("Authorization", `Bearer ${token}`).send({ status: "IN_TRANSIT" });
    await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "OUT_FOR_DELIVERY" });

    const res = await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "DELIVERED" });
    expect(res.status).toBe(400);
  });

  it("Shipment cannot become DELIVERED if COD exists and COD is not collected", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token, { codAmount: 80 });
    const shipmentId = created.body.data.id as string;

    await verifyShipmentOtp(token, shipmentId);
    await request(app).patch(`/shipments/${shipmentId}/status`).set("Authorization", `Bearer ${token}`).send({ status: "PICKED_UP" });
    await request(app).patch(`/shipments/${shipmentId}/status`).set("Authorization", `Bearer ${token}`).send({ status: "IN_TRANSIT" });
    await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "OUT_FOR_DELIVERY" });

    const res = await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "DELIVERED" });
    expect(res.status).toBe(400);
  });

  it("Shipment can become DELIVERED after OTP verified and COD collected", async () => {
    const { token: staffToken } = await loginAsStaff();
    const created = await createTestShipment(staffToken, { codAmount: 120 });
    const shipmentId = created.body.data.id as string;

    await verifyShipmentOtp(staffToken, shipmentId);
    await collectCod(staffToken, shipmentId);

    await request(app).patch(`/shipments/${shipmentId}/status`).set("Authorization", `Bearer ${staffToken}`).send({ status: "PICKED_UP" });
    await request(app).patch(`/shipments/${shipmentId}/status`).set("Authorization", `Bearer ${staffToken}`).send({ status: "IN_TRANSIT" });
    await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "OUT_FOR_DELIVERY" });

    const res = await request(app)
      .patch(`/shipments/${shipmentId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "DELIVERED" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("DELIVERED");
  });
});

