import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";
import { assignDriverToShipment, createTestShipment } from "../../test/helpers/test-data.helper";

describe("DRIVERS", () => {
  it("Admin/staff can list drivers using GET /drivers", async () => {
    const { token } = await loginAsStaff();
    const res = await request(app).get("/drivers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeTruthy();
  });

  it("Driver can update own location using PUT /driver/update-location", async () => {
    const { token } = await loginAsDriver();
    const res = await request(app)
      .put("/driver/update-location")
      .set("Authorization", `Bearer ${token}`)
      .send({ lat: 9.03, lng: 38.74 });
    expect(res.status).toBe(200);
    expect(res.body.data.currentLat).toBeTruthy();
  });

  it("Driver can see only assigned shipments using GET /driver/shipments", async () => {
    const { token: staffToken } = await loginAsStaff();
    const { token: driverToken, user: driverUser } = await loginAsDriver();

    const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
    expect(driver).toBeTruthy();

    const created = await createTestShipment(staffToken);
    expect(created.status).toBe(201);
    const shipmentId = created.body.data.id as string;

    await assignDriverToShipment(staffToken, shipmentId, driver!.id);

    const list = await request(app).get("/driver/shipments").set("Authorization", `Bearer ${driverToken}`);
    expect(list.status).toBe(200);
    const ids = (list.body.data as any[]).map((s) => s.id);
    expect(ids).toContain(shipmentId);
  });

  it("Driver cannot update shipment not assigned to them", async () => {
    const { token: staffToken } = await loginAsStaff();
    const { token: driverToken } = await loginAsDriver();

    const created = await createTestShipment(staffToken);
    const shipmentId = created.body.data.id as string;

    const res = await request(app)
      .put(`/driver/update-status/${shipmentId}`)
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ status: "PICKED_UP" });
    expect(res.status).toBe(403);
  });
});

