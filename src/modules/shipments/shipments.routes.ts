import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as shipmentsController from "./shipments.controller";
import {
  assignDriverSchema,
  createShipmentSchema,
  listShipmentsSchema,
  shipmentIdParamsSchema,
  updateShipmentStatusSchema,
  verifyOtpSchema,
} from "./shipments.validation";

const router = Router();

router.use(authMiddleware);

router.post("/", requireRole("ADMIN", "STAFF", "CUSTOMER"), validate(createShipmentSchema), shipmentsController.create);
router.get("/", validate(listShipmentsSchema), shipmentsController.list);
router.get("/:id", validate(shipmentIdParamsSchema), shipmentsController.getById);

router.patch(
  "/:id/assign-driver",
  requireRole("ADMIN", "STAFF"),
  validate(assignDriverSchema),
  shipmentsController.assignDriver,
);

router.patch(
  "/:id/status",
  requireRole("ADMIN", "STAFF"),
  validate(updateShipmentStatusSchema),
  shipmentsController.updateStatus,
);

router.get("/:id/qr", validate(shipmentIdParamsSchema), shipmentsController.qr);
router.post("/:id/verify-otp", validate(verifyOtpSchema), shipmentsController.verifyOtp);

export default router;

