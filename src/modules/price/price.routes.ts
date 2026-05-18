import { Router } from "express";
import { publicRateLimiter } from "../../middleware/rateLimiter.middleware";
import { validate } from "../../middleware/validate.middleware";
import { calculate } from "./price.controller";
import { calculatePriceSchema } from "./price.validation";

const router = Router();

router.post(
  "/calculate",
  publicRateLimiter(10),
  validate(calculatePriceSchema),
  calculate
);

export default router;