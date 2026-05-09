import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as authController from "./auth.controller";
import { loginSchema, registerSchema, verifyLoginSchema, verifyRegistrationSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-registration", validate(verifyRegistrationSchema), authController.verifyRegistration);
router.post("/login", validate(loginSchema), authController.login);
router.post("/verify-login", validate(verifyLoginSchema), authController.verifyLogin);
router.get("/me", authMiddleware, authController.me);

export default router;
