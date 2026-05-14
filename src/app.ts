import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUiDist from "swagger-ui-dist";
import path from "path";

import { errorMiddleware } from "./middleware/error.middleware";
import { errorResponse, successResponse } from "./utils/response";
import { getEnv } from "./config/env";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import driversRoutes from "./modules/drivers/drivers.routes";
import driverSelfRoutes from "./modules/driver-self/driver-self.routes";
import shipmentsRoutes from "./modules/shipments/shipments.routes";
import activityRoutes from "./modules/activity/activity.routes";
import trackingRoutes from "./modules/tracking/tracking.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import codRoutes from "./modules/cod/cod.routes";
import pricingRoutes from "./modules/pricing/pricing.routes";
import priceRoutes from "./modules/price/price.routes";
import integrationsRoutes from "./modules/integrations/integrations.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import docsRoutes from "./modules/docs/docs.routes";
import issuesRoutes from "./modules/issues/issues.routes";
import routesRoutes from "./modules/routes/routes.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  return res.status(200).json(successResponse("OK", { status: "ok" }));
});

// Route mounting: NO /api prefix
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/drivers", driversRoutes);
app.use("/driver", driverSelfRoutes);
app.use("/shipments", shipmentsRoutes);
app.use("/activity", activityRoutes);
app.use("/track", trackingRoutes);
app.use("/payments", paymentsRoutes);
app.use("/cod", codRoutes);
app.use("/pricing", pricingRoutes);
app.use("/price", priceRoutes);
app.use("/integrations", integrationsRoutes);
app.use("/reports", reportsRoutes);
app.use("/docs", docsRoutes);
app.use("/issues", issuesRoutes);
app.use("/routes", routesRoutes);

const swaggerDistPath = swaggerUiDist.getAbsoluteFSPath();
const swaggerAssetsRequestedFromRoot = ["swagger-ui.css", "index.css", "favicon-32x32.png",
  "favicon-16x16.png", "swagger-ui-bundle.js", "swagger-ui-standalone-preset.js",
  "swagger-initializer.js"];
for (const asset of swaggerAssetsRequestedFromRoot) {
  app.get(`/${asset}`, (_req, res) => {
    res.sendFile(path.join(swaggerDistPath, asset));
  });
}

app.use((_req, res) => {
  return res.status(404).json(errorResponse("Route not found", 404, null));
});

app.use(errorMiddleware);

export default app;

