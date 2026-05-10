import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as activityController from "./activity.controller";
import { listActivitySchema, activityIdParamsSchema } from "./activity.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(listActivitySchema), activityController.list);
router.get("/:id", validate(activityIdParamsSchema), activityController.getById);

export default router;
