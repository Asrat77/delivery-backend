import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as usersService from "./users.service";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body);
  return res.status(201).json(successResponse("User created", user));
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = await usersService.listUsers(req.query as any);
  return res.status(200).json(successResponse("Users", data));
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUser(String(req.params.id));
  return res.status(200).json(successResponse("User", user));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUserStatus(String(req.params.id), req.body.status);
  return res.status(200).json(successResponse("User status updated", user));
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUserRole(String(req.params.id), req.body.role);
  return res.status(200).json(successResponse("User role updated", user));
});

