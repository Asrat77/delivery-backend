import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as codController from "./cod.controller";
import { markCollectedSchema, shipmentIdParamsSchema } from "./cod.validation";

const router = Router();

router.use(authMiddleware);

router.get("/:shipmentId", validate(shipmentIdParamsSchema), codController.get);
router.patch("/:shipmentId/mark-collected", validate(markCollectedSchema), codController.markCollected);

export default router;

