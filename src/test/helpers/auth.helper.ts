import request from "supertest";
import app from "../../app";

const PHONE_MAP: Record<string, string> = {
  "admin@example.com": "+251900000001",
  "staff@example.com": "+251900000002",
  "driver@example.com": "+251900000003",
  "customer@example.com": "+251900000004",
};

function getPhone(emailOrPhone: string): string {
  return PHONE_MAP[emailOrPhone] ?? emailOrPhone;
}

async function login(emailOrPhone: string) {
  await request(app).post("/auth/login").send({ emailOrPhone, password: "Password123!" }).expect(200);
  const phone = getPhone(emailOrPhone);
  const res = await request(app).post("/auth/verify-login").send({ phone, otp: "123456" }).expect(200);
  return res;
}

export async function loginAsAdmin() {
  const res = await login("admin@example.com");
  return { token: res.body.data.token as string, user: res.body.data.user };
}

export async function loginAsStaff() {
  const res = await login("staff@example.com");
  return { token: res.body.data.token as string, user: res.body.data.user };
}

export async function loginAsDriver() {
  const res = await login("driver@example.com");
  return { token: res.body.data.token as string, user: res.body.data.user };
}

export async function loginAsCustomer() {
  const res = await login("customer@example.com");
  return { token: res.body.data.token as string, user: res.body.data.user };
}
