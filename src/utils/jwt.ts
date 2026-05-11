import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";
import { ApiError } from "./ApiError";

export type AuthUser = {
  id: string;
  role: string;
  phone?: string;
};

type JwtPayload = {
  sub?: string;
  userId?: string;
  role?: string;
};

/**
 * Verify a JWT token and return the authenticated user.
 * Reusable across REST middleware and Socket.IO auth.
 */
export async function verifyToken(token: string): Promise<AuthUser> {
  const env = getEnv();
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

  const userId = payload.sub ?? payload.userId;
  if (!userId || !payload.role) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, phone: true },
  });

  if (!user) throw new ApiError(401, "Unauthorized");
  if (user.status !== "ACTIVE") throw new ApiError(403, "User is inactive");

  return { id: user.id, role: user.role, phone: user.phone ?? undefined };
}
