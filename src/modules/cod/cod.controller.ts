import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as codService from "./cod.service";
import { requireRole } from "../../middleware/role.middleware";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await codService.listCod({ query: req.query });
  return res.status(200).json(successResponse("COD transactions", data));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const cod = await codService.getCod({
    shipmentId: String(req.params.shipmentId),
    userId: req.user!.id,
    role: req.user!.role,
  });
  return res.status(200).json(successResponse("COD", cod));
});

export const markCollected = asyncHandler(async (req: Request, res: Response) => {
  const cod = await codService.markCollected({
    shipmentId: String(req.params.shipmentId),
    userId: req.user!.id,
    role: req.user!.role,
  });
  return res.status(200).json(successResponse("COD marked as collected", cod));
});

