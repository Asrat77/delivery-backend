import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import * as trackingController from "./tracking.controller";
import { z } from "zod";

const router = Router();

router.get(
  "/:trackingNumber",
  validate({ params: z.object({ trackingNumber: z.string().min(3) }) }),
  trackingController.track,
);

export default router;

