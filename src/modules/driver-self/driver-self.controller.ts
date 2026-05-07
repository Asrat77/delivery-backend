import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as driverSelfService from "./driver-self.service";

export const getMyShipments = asyncHandler(async (req: Request, res: Response) => {
  const shipments = await driverSelfService.getMyShipments(req.user!.id);
  return res.status(200).json(successResponse("My shipments", shipments));
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverSelfService.updateMyLocation(req.user!.id, req.body.lat, req.body.lng);
  return res.status(200).json(successResponse("Location updated", driver));
});

export const updateShipmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await driverSelfService.updateAssignedShipmentStatus({
    userId: req.user!.id,
    shipmentId: String(req.params.shipmentId),
    status: req.body.status,
    locationText: req.body.locationText,
    lat: req.body.lat,
    lng: req.body.lng,
  });
  return res.status(200).json(successResponse("Shipment status updated", shipment));
});

