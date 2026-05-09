import { Router, RequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";

const router = Router();

let swaggerDocument: Record<string, unknown> | null = null;

try {
  swaggerDocument = yaml.load(
    fs.readFileSync(path.join(__dirname, "../../../docs/swagger.yml"), "utf8")
  ) as Record<string, unknown>;
} catch {
  console.warn("⚠️  Failed to load docs/swagger.yml — Swagger UI unavailable");
}

router.get("/json", (_req, res) => {
  if (!swaggerDocument) {
    return res.status(503).json({ success: false, message: "Swagger spec not loaded" });
  }
  res.json(swaggerDocument);
});

if (swaggerDocument) {
  router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customSiteTitle: "Delivery Backend API Docs",
  }));
} else {
  const fallback: RequestHandler[] = [(_req, res) => {
    res.status(503).json({ success: false, message: "Swagger UI unavailable — spec not loaded" });
  }];
  router.use("/", ...fallback);
}

export default router;
