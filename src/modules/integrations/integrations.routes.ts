import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as integrationsController from "./integrations.controller";
import { createShipmentSchema, quoteSchema } from "./integrations.validation";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN", "STAFF"));

router.get("/providers", integrationsController.providers);
router.post("/dhl/quote", validate(quoteSchema), integrationsController.dhlQuote);
router.post("/dhl/create-shipment", validate(createShipmentSchema), integrationsController.dhlCreateShipment);

export default router;

