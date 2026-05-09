import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerUiDist from "swagger-ui-dist";
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

router.use("/", swaggerUiDist.serve);
router.get("/", swaggerUiDist.setup(swaggerDocument, {
  swaggerUrl: "/docs/json",
  explorer: true,
  customSiteTitle: "Delivery Backend API Docs",
}));

export default router;
