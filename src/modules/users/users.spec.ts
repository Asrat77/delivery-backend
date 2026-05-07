import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { loginAsAdmin, loginAsStaff } from "../../test/helpers/auth.helper";

describe("USERS", () => {
  it("Admin can create staff user", async () => {
    const { token } = await loginAsAdmin();
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Staff",
        email: `staff-${Date.now()}@example.com`,
        phone: `+25191${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: "Password123!",
        role: "STAFF",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("STAFF");
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("Admin can create driver user and driver profile is created", async () => {
    const { token } = await loginAsAdmin();
    const email = `driver-${Date.now()}@example.com`;
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Driver",
        email,
        phone: `+25192${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: "Password123!",
        role: "DRIVER",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("DRIVER");

    const userId = res.body.data.id as string;
    const driver = await prisma.driver.findUnique({ where: { userId } });
    expect(driver).toBeTruthy();
  });

  it("Staff cannot create admin user", async () => {
    const { token } = await loginAsStaff();
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bad Admin",
        email: `bad-admin-${Date.now()}@example.com`,
        phone: `+25193${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: "Password123!",
        role: "ADMIN",
      });
    expect(res.status).toBe(403);
  });

  it("Unauthenticated user cannot list users", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
  });

  it("Password hash is never returned", async () => {
    const { token } = await loginAsAdmin();
    const res = await request(app).get("/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const items = res.body.data.items as any[];
    expect(items.length).toBeGreaterThan(0);
    for (const u of items) {
      expect(u.passwordHash).toBeUndefined();
    }
  });
});

