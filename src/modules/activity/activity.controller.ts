import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as activityService from "./activity.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await activityService.listActivity({
    userId: req.user!.id,
    role: req.user!.role,
    userPhone: req.user!.phone,
    query: req.query,
  });
  return res.status(200).json(successResponse("Activity", data));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await activityService.getActivityDetail({
    shipmentId: String(req.params.id),
    userId: req.user!.id,
    role: req.user!.role,
    userPhone: req.user!.phone,
  });
  return res.status(200).json(successResponse("Activity detail", data));
});
