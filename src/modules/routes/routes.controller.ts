import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as routesService from "./routes.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await routesService.createRoute(req.body);
  return res.status(201).json(successResponse("Route saved", data));
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await routesService.listRoutes();
  return res.status(200).json(successResponse("Routes", data));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const route = await routesService.getRouteById(String(req.params.id));
  return res.status(200).json(successResponse("Route", route));
});
