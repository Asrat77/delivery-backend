import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError } from "../utils/ApiError";

export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new ApiError(401, "Unauthorized"));
    if (!roles.includes(user.role)) return next(new ApiError(403, "Forbidden"));
    return next();
  };
}

