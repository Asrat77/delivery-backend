import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as reportsService from "./reports.service";

export const summary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.summary();
  return res.status(200).json(successResponse("Summary", data));
});

export const shipmentsByStatus = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.shipmentsByStatus();
  return res.status(200).json(successResponse("Shipments by status", data));
});

export const payments = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.payments();
  return res.status(200).json(successResponse("Payments report", data));
});

export const cod = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.cod();
  return res.status(200).json(successResponse("COD report", data));
});

export const driverPerformance = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.driverPerformance();
  return res.status(200).json(successResponse("Driver performance", data));
});

