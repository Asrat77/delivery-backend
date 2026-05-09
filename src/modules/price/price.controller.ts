import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { calculatePrice } from "./price.service";

export const calculate = asyncHandler(async (req: Request, res: Response) => {
  const result = await calculatePrice(req.body);
  return res.status(200).json(successResponse("Price calculated", result));
});