import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin User", phone: "+251900000001", role: "ADMIN", status: "ACTIVE" },
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
    update: { name: "Staff User", phone: "+251900000002", role: "STAFF", status: "ACTIVE" },
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
    update: { name: "Delivery Driver", phone: "+251900000003", role: "DRIVER", status: "ACTIVE" },
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
    update: { name: "Customer User", phone: "+251900000004", role: "CUSTOMER", status: "ACTIVE" },
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
    where: { id: "seed-bicycle" },
    update: { isActive: true },
    create: {
      id: "seed-bicycle",
      name: "City Bicycle Delivery",
      type: "PER_KG",
      deliveryType: "BICYCLE",
      baseFare: 30,
      ratePerKm: 10,
      isActive: true,
    },
  });

  await prisma.pricingRule.upsert({
    where: { id: "seed-motorbike" },
    update: { isActive: true },
    create: {
      id: "seed-motorbike",
      name: "City Motorbike Delivery",
      type: "PER_KG",
      deliveryType: "MOTORBIKE",
      baseFare: 50,
      ratePerKm: 15,
      isActive: true,
    },
  });

  await prisma.pricingRule.upsert({
    where: { id: "seed-foot" },
    update: { isActive: true },
    create: {
      id: "seed-foot",
      name: "City Foot Delivery",
      type: "PER_KG",
      deliveryType: "FOOT",
      baseFare: 20,
      ratePerKm: 5,
      isActive: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete", { adminId: admin.id });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

