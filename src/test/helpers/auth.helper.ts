import request from "supertest";
import app from "../../app";

async function login(emailOrPhone: string) {
  const res = await request(app).post("/auth/login").send({ emailOrPhone, password: "Password123!" });
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

