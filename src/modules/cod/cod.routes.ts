import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as codController from "./cod.controller";
import { listCodSchema, markCollectedSchema, shipmentIdParamsSchema } from "./cod.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRole("ADMIN", "STAFF"), validate(listCodSchema), codController.list);
router.get("/:shipmentId", validate(shipmentIdParamsSchema), codController.get);
router.patch("/:shipmentId/mark-collected", validate(markCollectedSchema), codController.markCollected);

export default router;

