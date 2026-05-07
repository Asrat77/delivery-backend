import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as pricingService from "./pricing.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const rule = await pricingService.createPricingRule(req.body);
  return res.status(201).json(successResponse("Pricing rule created", rule));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await pricingService.listPricingRules(req.query as any);
  return res.status(200).json(successResponse("Pricing rules", data));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const rule = await pricingService.getPricingRule(String(req.params.id));
  return res.status(200).json(successResponse("Pricing rule", rule));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const rule = await pricingService.updatePricingRule(String(req.params.id), req.body);
  return res.status(200).json(successResponse("Pricing rule updated", rule));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const rule = await pricingService.updatePricingRuleStatus(String(req.params.id), req.body.isActive);
  return res.status(200).json(successResponse("Pricing rule status updated", rule));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await pricingService.deletePricingRule(String(req.params.id));
  return res.status(200).json(successResponse("Pricing rule deleted", {}));
});

