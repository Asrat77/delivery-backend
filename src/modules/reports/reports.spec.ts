import request from "supertest";
import app from "../../app";
import { loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";

describe("REPORTS", () => {
  it("Staff/admin can access /reports/summary", async () => {
    const { token } = await loginAsStaff();
    const res = await request(app).get("/reports/summary").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalShipments).toBeDefined();
  });

  it("Driver cannot access admin reports", async () => {
    const { token } = await loginAsDriver();
    const res = await request(app).get("/reports/summary").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("/reports/driver-performance returns driver performance data", async () => {
    const { token } = await loginAsStaff();
    const res = await request(app).get("/reports/driver-performance").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

