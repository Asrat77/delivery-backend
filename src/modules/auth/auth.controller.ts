import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as authService from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.sendRegistrationOtp(req.body);
  return res.status(200).json(successResponse("OTP sent to phone", result));
});

export const verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.verifyRegistrationOtp(req.body);
  return res.status(201).json(successResponse("Registration successful", { token, user }));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.sendLoginOtp(req.body);
  return res.status(200).json(successResponse("OTP sent to phone", result));
});

export const verifyLogin = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.verifyLoginOtp(req.body);
  return res.status(200).json(successResponse("Login successful", { token, user }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id);
  return res.status(200).json(successResponse("Me", user));
});
