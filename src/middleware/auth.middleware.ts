import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthUser } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type { AuthUser };

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.user = await verifyToken(token);
    return next();
  } catch {
    return next(new ApiError(401, "Unauthorized"));
  }
}

