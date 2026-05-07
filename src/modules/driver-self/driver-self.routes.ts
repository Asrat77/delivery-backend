import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as driverSelfController from "./driver-self.controller";
import { updateLocationSchema, updateShipmentStatusSchema } from "./driver-self.validation";

const router = Router();

router.use(authMiddleware, requireRole("DRIVER"));

router.get("/shipments", driverSelfController.getMyShipments);
router.put("/update-location", validate(updateLocationSchema), driverSelfController.updateLocation);
router.put("/update-status/:shipmentId", validate(updateShipmentStatusSchema), driverSelfController.updateShipmentStatus);

export default router;

