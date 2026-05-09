import { Request, Response } from "express";
import * as priceCalculationService from "./price-calculation.service";

export async function calculate(req: Request, res: Response) {
  const result = await priceCalculationService.calculatePrice(req.body);
  res.json(result);
}