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
    where: { id: "seed-fixed" },
    update: { isActive: true },
    create: {
      id: "seed-fixed",
      name: "Fixed Small Package",
      type: "FIXED",
      packageType: "SMALL",
      fixedPrice: 150,
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
      minWeight: 0.1,
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

