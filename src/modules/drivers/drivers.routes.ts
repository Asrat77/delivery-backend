import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as driversController from "./drivers.controller";
import { driverIdParamsSchema, listDriversSchema } from "./drivers.validation";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN", "STAFF"));

router.get("/", validate(listDriversSchema), driversController.listDrivers);
router.get("/:id", validate(driverIdParamsSchema), driversController.getDriver);

export default router;

