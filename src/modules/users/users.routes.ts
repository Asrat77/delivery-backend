import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as usersController from "./users.controller";
import {
  createUserSchema,
  listUsersSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamsSchema,
} from "./users.validation";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.post("/", validate(createUserSchema), usersController.createUser);
router.get("/", validate(listUsersSchema), usersController.listUsers);
router.get("/:id", validate(userIdParamsSchema), usersController.getUser);
router.patch("/:id/status", validate(updateUserStatusSchema), usersController.updateStatus);
router.patch("/:id/role", validate(updateUserRoleSchema), usersController.updateRole);

export default router;

