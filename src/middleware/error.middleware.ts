import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { errorResponse } from "../utils/response";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json(errorResponse("Validation Error", 422, err.flatten()));
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(errorResponse(err.message, err.statusCode, err.details));
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json(errorResponse("Internal Server Error", 500, null));
}

