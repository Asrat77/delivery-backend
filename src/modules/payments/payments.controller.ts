import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as paymentsService from "./payments.service";

export const get = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.getPayment({
    shipmentId: String(req.params.shipmentId),
    userId: req.user!.id,
    role: req.user!.role,
  });
  return res.status(200).json(successResponse("Payment", payment));
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentsService.markPaid({
    shipmentId: String(req.params.shipmentId),
    actorRole: req.user!.role,
    providerReference: req.body.providerReference,
  });
  return res.status(200).json(successResponse("Payment marked as paid", payment));
});

