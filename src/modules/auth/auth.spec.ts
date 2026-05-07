import request from "supertest";
import app from "../../app";
import { loginAsAdmin, loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";

describe("AUTH", () => {
  it("POST /auth/login should login seeded admin", async () => {
    const res = await request(app).post("/auth/login").send({ emailOrPhone: "admin@example.com", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("admin@example.com");
  });

  it("POST /auth/login should login seeded staff", async () => {
    const res = await request(app).post("/auth/login").send({ emailOrPhone: "staff@example.com", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("staff@example.com");
  });

  it("POST /auth/login should login seeded driver", async () => {
    const res = await request(app).post("/auth/login").send({ emailOrPhone: "driver@example.com", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("driver@example.com");
    expect(res.body.data.user.role).toBe("DRIVER");
  });

  it("POST /auth/login should reject wrong password", async () => {
    const res = await request(app).post("/auth/login").send({ emailOrPhone: "admin@example.com", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("GET /auth/me should return current user with token", async () => {
    const { token, user } = await loginAsAdmin();
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("GET /auth/me should reject missing token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});

