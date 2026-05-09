import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { calculate } from "./price.controller";
import { calculatePriceSchema } from "./price.validation";

const router = Router();

router.post(
  "/calculate",
  authMiddleware,
  validate(calculatePriceSchema),
  calculate
);

export default router;