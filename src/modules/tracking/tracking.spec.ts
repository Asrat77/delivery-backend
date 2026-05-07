import request from "supertest";
import app from "../../app";
import { loginAsStaff } from "../../test/helpers/auth.helper";
import { createTestShipment } from "../../test/helpers/test-data.helper";

describe("TRACKING", () => {
  it("GET /track/:trackingNumber works without token", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const tn = created.body.data.trackingNumber as string;

    const res = await request(app).get(`/track/${tn}`);
    expect(res.status).toBe(200);
    expect(res.body.data.trackingNumber).toBe(tn);
  });

  it("Public tracking returns timeline", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const tn = created.body.data.trackingNumber as string;

    const res = await request(app).get(`/track/${tn}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  it("Public tracking does not expose passwordHash", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const tn = created.body.data.trackingNumber as string;

    const res = await request(app).get(`/track/${tn}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).not.toContain("passwordHash");
  });

  it("Public tracking does not expose otpCodeHash", async () => {
    const { token } = await loginAsStaff();
    const created = await createTestShipment(token);
    const tn = created.body.data.trackingNumber as string;

    const res = await request(app).get(`/track/${tn}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).not.toContain("otpCodeHash");
  });

  it("Invalid tracking number returns 404", async () => {
    const res = await request(app).get("/track/DOES_NOT_EXIST_123");
    expect(res.status).toBe(404);
  });
});

