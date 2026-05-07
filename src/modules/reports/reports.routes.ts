import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as reportsController from "./reports.controller";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN", "STAFF"));

router.get("/summary", reportsController.summary);
router.get("/shipments-by-status", reportsController.shipmentsByStatus);
router.get("/payments", reportsController.payments);
router.get("/cod", reportsController.cod);
router.get("/driver-performance", reportsController.driverPerformance);

export default router;

