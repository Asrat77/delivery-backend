import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as issuesController from "./issues.controller";
import {
  createIssueSchema,
  issueIdParamsSchema,
  listIssuesSchema,
} from "./issues.validation";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "STAFF", "CUSTOMER", "DRIVER"),
  validate(createIssueSchema),
  issuesController.create,
);

router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN", "STAFF"),
  validate(listIssuesSchema),
  issuesController.list,
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "STAFF"),
  validate(issueIdParamsSchema),
  issuesController.getById,
);

export default router;
