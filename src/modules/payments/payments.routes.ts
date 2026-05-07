import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as paymentsController from "./payments.controller";
import { markPaidSchema, shipmentIdParamsSchema } from "./payments.validation";

const router = Router();

router.use(authMiddleware);

router.get("/:shipmentId", validate(shipmentIdParamsSchema), paymentsController.get);
router.patch(
  "/:shipmentId/mark-paid",
  requireRole("ADMIN", "STAFF"),
  validate(markPaidSchema),
  paymentsController.markPaid,
);

export default router;

