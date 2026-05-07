import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { toPagination } from "../../utils/pagination";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createUser(input: {
  name: string;
  email?: string;
  phone: string;
  password: string;
  role: "ADMIN" | "STAFF" | "DRIVER" | "CUSTOMER";
  status?: "ACTIVE" | "INACTIVE";
}) {
  const env = getEnv();
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        status: input.status ?? "ACTIVE",
        driverProfile:
          input.role === "DRIVER"
            ? {
                create: {},
              }
            : undefined,
      },
      select: safeUserSelect,
    });

    return user;
  } catch (e: any) {
    if (e?.code === "P2002") throw new ApiError(409, "User already exists", e?.meta ?? null);
    throw e;
  }
}

export async function listUsers(query: { page: number; limit: number; role?: string; status?: string }) {
  const { skip, take, page, limit } = toPagination(query);
  const where = {
    deletedAt: null as null,
    ...(query.role ? { role: query.role as any } : {}),
    ...(query.status ? { status: query.status as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: safeUserSelect }),
    prisma.user.count({ where }),
  ]);

  return { items, page, limit, total };
}

export async function getUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: safeUserSelect });
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function updateUserStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  const user = await prisma.user.update({ where: { id }, data: { status }, select: safeUserSelect });
  return user;
}

export async function updateUserRole(id: string, role: "ADMIN" | "STAFF" | "DRIVER" | "CUSTOMER") {
  const user = await prisma.user.update({
    where: { id },
    data: {
      role,
      driverProfile:
        role === "DRIVER"
          ? {
              upsert: { create: {}, update: {} },
            }
          : undefined,
    },
    select: safeUserSelect,
  });

  if (role !== "DRIVER") {
    await prisma.driver.deleteMany({ where: { userId: id } });
  }

  return user;
}

