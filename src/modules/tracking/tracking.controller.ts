import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as trackingService from "./tracking.service";

export const track = asyncHandler(async (req: Request, res: Response) => {
  const data = await trackingService.trackByTrackingNumber(String(req.params.trackingNumber));
  return res.status(200).json(successResponse("Tracking", data));
});

