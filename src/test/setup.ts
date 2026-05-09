import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { afterAll, beforeAll } from "@jest/globals";

// Imported only for type reference; seed helper below covers the actual data.

dotenv.config();

// Prisma Client reads DATABASE_URL from process.env at import time in many setups.
// Set it as early as possible for tests.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.NODE_ENV = process.env.NODE_ENV || "test";

async function seedBaseUsers() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin User", phone: "+251900000001", role: "ADMIN", status: "ACTIVE", passwordHash },
    create: {
      name: "Admin User",
      email: "admin@example.com",
      phone: "+251900000001",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: { name: "Staff User", phone: "+251900000002", role: "STAFF", status: "ACTIVE", passwordHash },
    create: {
      name: "Staff User",
      email: "staff@example.com",
      phone: "+251900000002",
      passwordHash,
      role: "STAFF",
      status: "ACTIVE",
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "driver@example.com" },
    update: { name: "Delivery Driver", phone: "+251900000003", role: "DRIVER", status: "ACTIVE", passwordHash },
    create: {
      name: "Delivery Driver",
      email: "driver@example.com",
      phone: "+251900000003",
      passwordHash,
      role: "DRIVER",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: { name: "Customer User", phone: "+251900000004", role: "CUSTOMER", status: "ACTIVE", passwordHash },
    create: {
      name: "Customer User",
      email: "customer@example.com",
      phone: "+251900000004",
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { isAvailable: true },
    create: { userId: driverUser.id, isAvailable: true },
  });

  await prisma.pricingRule.upsert({
    where: { id: "seed-fixed" },
    update: { isActive: true },
    create: {
      id: "seed-fixed",
      name: "Fixed Small Package",
      type: "FIXED",
      packageType: "SMALL",
      fixedPrice: 150,
      baseFare: 30,
      ratePerKm: 10,
      isActive: true,
    },
  });

  await prisma.pricingRule.upsert({
    where: { id: "seed-perkg" },
    update: { isActive: true },
    create: {
      id: "seed-perkg",
      name: "Per KG Standard",
      type: "PER_KG",
      pricePerKg: 40,
      baseFare: 30,
      ratePerKm: 10,
      minWeight: 0.1,
      isActive: true,
    },
  });
}

beforeAll(async () => {
  await seedBaseUsers();
});

afterAll(async () => {
  await prisma.$disconnect();
});

