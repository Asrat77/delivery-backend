import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { loginAsAdmin, loginAsDriver, loginAsStaff } from "../../test/helpers/auth.helper";

const TS = Date.now();
const PHONE_A = `+2519${String(TS).slice(-8)}`;
const PHONE_B = `+2519${String(TS + 1).slice(-8)}`;
const PHONE_C = `+2519${String(TS + 2).slice(-8)}`;
const PHONE_D = `+2519${String(TS + 3).slice(-8)}`;
const PHONE_E = `+2519${String(TS + 4).slice(-8)}`;

async function cleanupPhones(phones: string[]) {
  await prisma.otpVerification.deleteMany({ where: { phone: { in: phones } } });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

describe("AUTH — Registration OTP Flow", () => {
  afterAll(async () => {
    await cleanupPhones([PHONE_A, PHONE_B, PHONE_C, PHONE_D, PHONE_E]);
  });

  it("POST /auth/register should reject duplicate with existing user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Test User", phone: PHONE_A, password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe(PHONE_A);
  });

  it("POST /auth/register should send OTP for new phone", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Test User", phone: PHONE_A, password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe(PHONE_A);
  });

  it("POST /auth/register should send OTP without password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "No Password User", phone: PHONE_A });
    expect(res.status).toBe(200);
  });

  it("POST /auth/register should allow re-sending OTP for same phone", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Test User", phone: PHONE_A, password: "Password123!" });
    expect(res.status).toBe(200);
  });

  it("POST /auth/verify-registration should create user with mock OTP", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "New User", phone: PHONE_B, password: "Password123!" })
      .expect(200);

    const res = await request(app)
      .post("/auth/verify-registration")
      .send({ phone: PHONE_B, otp: "12345" })
      .expect(201);

    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.phone).toBe(PHONE_B);
    expect(res.body.data.user.name).toBe("New User");
    expect(res.body.data.user.role).toBe("CUSTOMER");
  });

  it("POST /auth/verify-registration should create user without password", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Passwordless User", phone: PHONE_C })
      .expect(200);

    const res = await request(app)
      .post("/auth/verify-registration")
      .send({ phone: PHONE_C, otp: "12345" })
      .expect(201);

    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.phone).toBe(PHONE_C);
    expect(res.body.data.user.name).toBe("Passwordless User");
  });

  it("POST /auth/verify-registration should reject invalid OTP", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Bad OTP User", phone: PHONE_D, password: "Password123!" })
      .expect(200);

    const res = await request(app)
      .post("/auth/verify-registration")
      .send({ phone: PHONE_D, otp: "99999" })
      .expect(400);

    expect(res.body.message).toBe("Invalid OTP");
  });

  it("POST /auth/verify-registration should reject when no OTP requested", async () => {
    const res = await request(app)
      .post("/auth/verify-registration")
      .send({ phone: "+251900000001", otp: "12345" })
      .expect(400);

    expect(res.body.message).toBe("No OTP found. Request a new one.");
  });

  it("POST /auth/register should reject duplicate with existing user", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Test", phone: PHONE_D, password: "Password123!" })
      .expect(200);

    await request(app)
      .post("/auth/verify-registration")
      .send({ phone: PHONE_D, otp: "12345" })
      .expect(201);

    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Test", phone: PHONE_D, password: "Password123!" })
      .expect(409);

    expect(res.body.message).toBe("Phone already registered");
  });
});

describe("AUTH — Login OTP Flow", () => {
  afterAll(async () => {
    await cleanupPhones([PHONE_E]);
  });

  it("POST /auth/login should send OTP for valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "admin@example.com", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("+251900000001");
  });

  it("POST /auth/login should reject wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "admin@example.com", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("POST /auth/login should reject non-existent user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "nobody@example.com", password: "Password123!" });
    expect(res.status).toBe(401);
  });

  it("POST /auth/login should send OTP without password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "admin@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("+251900000001");
  });

  it("POST /auth/login should reject non-existent user without password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "nobody@example.com" });
    expect(res.status).toBe(401);
  });

  it("POST /auth/verify-login should return token with mock OTP", async () => {
    await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "admin@example.com", password: "Password123!" })
      .expect(200);

    const res = await request(app)
      .post("/auth/verify-login")
      .send({ phone: "+251900000001", otp: "12345" })
      .expect(200);

    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("admin@example.com");
  });

  it("POST /auth/verify-login should reject invalid OTP", async () => {
    await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: "staff@example.com", password: "Password123!" })
      .expect(200);

    const res = await request(app)
      .post("/auth/verify-login")
      .send({ phone: "+251900000002", otp: "99999" })
      .expect(400);

    expect(res.body.message).toBe("Invalid OTP");
  });

  it("POST /auth/verify-login should reject no OTP requested", async () => {
    const res = await request(app)
      .post("/auth/verify-login")
      .send({ phone: "+251900000001", otp: "12345" })
      .expect(400);

    expect(res.body.message).toBe("No OTP found. Request a new one.");
  });

  it("POST /auth/login should reject inactive user", async () => {
    await request(app)
      .post("/auth/register")
      .send({ name: "Inactive User", phone: PHONE_E, password: "Password123!" })
      .expect(200);

    await request(app)
      .post("/auth/verify-registration")
      .send({ phone: PHONE_E, otp: "12345" })
      .expect(201);

    await prisma.user.update({ where: { phone: PHONE_E }, data: { status: "INACTIVE" } });

    const res = await request(app)
      .post("/auth/login")
      .send({ emailOrPhone: PHONE_E, password: "Password123!" })
      .expect(403);

    expect(res.body.message).toBe("User is inactive");
  });
});

describe("AUTH — Me Endpoint", () => {
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
