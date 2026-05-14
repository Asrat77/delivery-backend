import { Router } from "express";
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

function fixSwaggerDistAssetPaths(html: string): string {
  return html
    .replace('href="index.css"', 'href="/docs/index.css"')
    .replace('href="./swagger-ui.css"', 'href="/docs/swagger-ui.css"')
    .replace('href="./favicon-32x32.png"', 'href="/docs/favicon-32x32.png"')
    .replace('href="./favicon-16x16.png"', 'href="/docs/favicon-16x16.png"')
    .replace('src="./swagger-ui-bundle.js"', 'src="/docs/swagger-ui-bundle.js"')
    .replace('src="./swagger-ui-standalone-preset.js"', 'src="/docs/swagger-ui-standalone-preset.js"')
    .replace('src="./swagger-initializer.js"', 'src="/docs/swagger-initializer.js"');
}

router.get("/", (_req, res) => {
  if (!swaggerDocument) {
    return res.status(503).json({ success: false, message: "Swagger spec not loaded" });
  }
  const indexHtml = path.join(swaggerUiDist.getAbsoluteFSPath(), "index.html");
  res.type("html").send(fixSwaggerDistAssetPaths(fs.readFileSync(indexHtml, "utf8")));
});

// Serve a custom swagger-initializer.js that loads the spec from /docs/json
// instead of the default petstore URL — avoids inline scripts (CSP-safe)
router.use("/swagger-initializer.js", (_req, res) => {
  const initPath = path.join(swaggerUiDist.getAbsoluteFSPath(), "swagger-initializer.js");
  res.type("application/javascript").send(
    fs.readFileSync(initPath, "utf8").replace(
      "https://petstore.swagger.io/v2/swagger.json",
      "/docs/json"
    )
  );
});

router.use("/swagger-ui-bundle.js", (_req, res) => {
  res.type("application/javascript")
     .sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), "swagger-ui-bundle.js"));
});
router.use("/swagger-ui-standalone-preset.js", (_req, res) => {
  res.type("application/javascript")
     .sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), "swagger-ui-standalone-preset.js"));
});
router.use("/swagger-ui.css", (_req, res) => {
  res.type("text/css")
     .sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), "swagger-ui.css"));
});
router.use("/index.css", (_req, res) => {
  res.type("text/css")
     .sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), "index.css"));
});
router.use("/favicon-32x32.png", (_req, res) => {
  res.type("image/png").sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), "favicon-32x32.png"));
});
router.use("/favicon-16x16.png", (_req, res) => {
  res.type("image/png").sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), "favicon-16x16.png"));
});

export default router;
