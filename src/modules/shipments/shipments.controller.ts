import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { prisma } from "../../config/prisma";
import { getIO } from "../live-tracking/live-tracking.socket";
import * as shipmentsService from "./shipments.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await shipmentsService.createShipment({
    actorUserId: req.user!.id,
    actorRole: req.user!.role,
    data: req.body,
  });
  return res.status(201).json(successResponse("Shipment created", data));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await shipmentsService.listShipments({ userId: req.user!.id, userPhone: req.user!.phone, role: req.user!.role, query: req.query });
  return res.status(200).json(successResponse("Shipments", data));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await shipmentsService.getShipmentById({
    shipmentId: String(req.params.id),
    userId: req.user!.id,
    userPhone: req.user!.phone,
    role: req.user!.role,
  });
  return res.status(200).json(successResponse("Shipment", shipment));
});

export const assignDriver = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await shipmentsService.assignDriver({
    shipmentId: String(req.params.id),
    driverId: req.body.driverId,
    assignedById: req.user!.id,
  });

  try {
    const io = getIO();
    const driver = await prisma.driver.findUnique({
      where: { id: req.body.driverId },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (driver) {
      io.to(`shipment:${shipment.id}`).emit("shipment:driver-assigned", {
        shipmentId: shipment.id,
        driverId: driver.id,
        driverName: driver.user.name,
        driverPhone: driver.user.phone,
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    // Socket not initialized — running in test or non-socket environment
  }

  return res.status(200).json(successResponse("Driver assigned", shipment));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await shipmentsService.updateShipmentStatus({
    shipmentId: String(req.params.id),
    status: req.body.status,
    actorUserId: req.user!.id,
    actorRole: req.user!.role,
  });
  return res.status(200).json(successResponse("Shipment status updated", shipment));
});

export const qr = asyncHandler(async (req: Request, res: Response) => {
  const dataUrl = await shipmentsService.getShipmentQrDataUrl(String(req.params.id));
  return res.status(200).json(successResponse("QR code", { dataUrl }));
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const proof = await shipmentsService.verifyShipmentOtp({ shipmentId: String(req.params.id), otp: req.body.otp });
  return res.status(200).json(
    successResponse("OTP verified", {
      id: proof.id,
      verified: proof.verified,
      verifiedAt: proof.verifiedAt,
    }),
  );
});

