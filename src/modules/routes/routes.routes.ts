import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as routesController from "./routes.controller";
import {
  createRouteSchema,
  routeIdParamsSchema,
} from "./routes.validation";

const router = Router();

router.get("/", routesController.list);
router.get("/:id", validate(routeIdParamsSchema), routesController.getById);

router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "STAFF"),
  validate(createRouteSchema),
  routesController.create,
);

export default router;
