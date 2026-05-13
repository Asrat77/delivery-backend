import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

function safeRouteSelect() {
  return {
    id: true,
    origin: true,
    destination: true,
    transitTime: true,
    pricing: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

export async function createRoute(input: {
  id: string;
  origin: string;
  destination: string;
  transitTime: string;
  pricing: { economy: number; standard: number; premium: number };
}) {
  const existing = await prisma.popularRoute.findUnique({
    where: { id: input.id },
  });

  if (existing) {
    return prisma.popularRoute.update({
      where: { id: input.id },
      data: {
        origin: input.origin,
        destination: input.destination,
        transitTime: input.transitTime,
        pricing: input.pricing as Prisma.JsonObject,
      },
      select: safeRouteSelect(),
    });
  }

  return prisma.popularRoute.create({
    data: {
      id: input.id,
      origin: input.origin,
      destination: input.destination,
      transitTime: input.transitTime,
      pricing: input.pricing,
    },
    select: safeRouteSelect(),
  });
}

export async function listRoutes() {
  return prisma.popularRoute.findMany({
    select: safeRouteSelect(),
    orderBy: { id: "asc" },
  });
}

export async function getRouteById(id: string) {
  const route = await prisma.popularRoute.findUnique({
    where: { id },
    select: safeRouteSelect(),
  });

  if (!route) {
    throw new ApiError(404, "Route not found");
  }

  return route;
}
