import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";
import { ApiError } from "../utils/ApiError";

export type AuthUser = {
  id: string;
  role: string;
  phone?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub?: string;
  userId?: string;
  role?: string;
};

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = header.slice("Bearer ".length).trim();
  const env = getEnv();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const userId = payload.sub ?? payload.userId;
    if (!userId || !payload.role) return next(new ApiError(401, "Unauthorized"));

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true, phone: true } });
    if (!user) return next(new ApiError(401, "Unauthorized"));
    if (user.status !== "ACTIVE") return next(new ApiError(403, "User is inactive"));

    req.user = { id: user.id, role: user.role, phone: user.phone };
    return next();
  } catch {
    return next(new ApiError(401, "Unauthorized"));
  }
}

