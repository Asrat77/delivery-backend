import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as pricingController from "./pricing.controller";
import {
  createPricingSchema,
  listPricingSchema,
  pricingIdParamsSchema,
  updatePricingSchema,
  updatePricingStatusSchema,
} from "./pricing.validation";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.post("/", validate(createPricingSchema), pricingController.create);
router.get("/", validate(listPricingSchema), pricingController.list);
router.get("/:id", validate(pricingIdParamsSchema), pricingController.get);
router.patch("/:id", validate(updatePricingSchema), pricingController.update);
router.patch("/:id/status", validate(updatePricingStatusSchema), pricingController.updateStatus);
router.delete("/:id", validate(pricingIdParamsSchema), pricingController.remove);

export default router;

