import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as authService from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.registerCustomer(req.body);
  return res.status(201).json(successResponse("Registered successfully", { token, user }));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);
  return res.status(200).json(successResponse("Login successful", { token, user }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id);
  return res.status(200).json(successResponse("Me", user));
});

