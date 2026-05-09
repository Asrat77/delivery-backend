import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";

const router = Router();

const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, "../../../docs/swagger.yml"), "utf8")
) as Record<string, unknown>;

router.get("/json", (_req, res) => {
  res.json(swaggerDocument);
});

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customSiteTitle: "Delivery Backend API Docs",
}));

export default router;
