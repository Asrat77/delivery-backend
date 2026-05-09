import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { loginAsAdmin, loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";
import { assignDriverToShipment, collectCod, createTestShipment } from "../../test/helpers/test-data.helper";

describe("COD", () => {
  it("Assigned driver can mark COD collected", async () => {
    const { token: staffToken } = await loginAsStaff();
    const { token: driverToken, user: driverUser } = await loginAsDriver();
    const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
    expect(driver).toBeTruthy();

    const created = await createTestShipment(staffToken, { codAmount: 50 });
    const shipmentId = created.body.data.id as string;
    await assignDriverToShipment(staffToken, shipmentId, driver!.id);

    const res = await request(app).patch(`/cod/${shipmentId}/mark-collected`).set("Authorization", `Bearer ${driverToken}`).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.collected).toBe(true);
  });

  it("Staff/admin can mark COD collected", async () => {
    const { token: staffToken } = await loginAsStaff();
    const created = await createTestShipment(staffToken, { codAmount: 70 });
    const shipmentId = created.body.data.id as string;

    const res = await collectCod(staffToken, shipmentId);
    expect(res.status).toBe(200);
    expect(res.body.data.collected).toBe(true);
  });

  it("Non-assigned driver cannot mark COD collected", async () => {
    const { token: adminToken } = await loginAsAdmin();

    const email = `other-driver-${Date.now()}@example.com`;
    const phone = `+25194${Math.floor(1000000 + Math.random() * 8999999)}`;

    const createdDriver = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Other Driver", email, phone, password: "Password123!", role: "DRIVER" });
    expect(createdDriver.status).toBe(201);

    await request(app).post("/auth/login").send({ emailOrPhone: email, password: "Password123!" }).expect(200);
    const verifyRes = await request(app).post("/auth/verify-login").send({ phone, otp: "12345" }).expect(200);
    const otherToken = verifyRes.body.data.token as string;

    const { token: staffToken } = await loginAsStaff();
    const created = await createTestShipment(staffToken, { codAmount: 90 });
    const shipmentId = created.body.data.id as string;

    const res = await request(app).patch(`/cod/${shipmentId}/mark-collected`).set("Authorization", `Bearer ${otherToken}`).send({});
    expect(res.status).toBe(403);
  });
});

