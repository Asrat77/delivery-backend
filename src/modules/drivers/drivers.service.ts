import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { toPagination } from "../../utils/pagination";

const driverSelect = {
  id: true,
  isAvailable: true,
  currentLat: true,
  currentLng: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  },
} as const;

export async function listDrivers(query: { page: number; limit: number; isAvailable?: boolean }) {
  const { skip, take, page, limit } = toPagination(query);
  const where: any = {};
  if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;

  const [items, total] = await Promise.all([
    prisma.driver.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: driverSelect }),
    prisma.driver.count({ where }),
  ]);

  return { items, page, limit, total };
}

export async function getDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id }, select: driverSelect });
  if (!driver) throw new ApiError(404, "Driver not found");
  return driver;
}

