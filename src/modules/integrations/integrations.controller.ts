import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as integrationsService from "./integrations.service";

export const providers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await integrationsService.listProviders();
  return res.status(200).json(successResponse("Providers", data));
});

export const dhlQuote = asyncHandler(async (req: Request, res: Response) => {
  const data = await integrationsService.dhlQuote(req.body);
  return res.status(200).json(successResponse("Quote", data));
});

export const dhlCreateShipment = asyncHandler(async (req: Request, res: Response) => {
  const data = await integrationsService.dhlCreateShipment(req.body);
  return res.status(200).json(successResponse("Shipment submitted", data));
});

