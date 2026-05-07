import request from "supertest";
import app from "./app";

describe("HEALTH", () => {
  it("GET /health returns API is running", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

