import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as driversService from "./drivers.service";

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
  const data = await driversService.listDrivers(req.query as any);
  return res.status(200).json(successResponse("Drivers", data));
});

export const getDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driversService.getDriver(String(req.params.id));
  return res.status(200).json(successResponse("Driver", driver));
});

