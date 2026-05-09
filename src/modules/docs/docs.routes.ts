import { Router, RequestHandler } from "express";
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

router.get("/", (_req, res) => {
  if (!swaggerDocument) {
    return res.status(503).json({ success: false, message: "Swagger spec not loaded" });
  }
  const initJS = `window.onload = function() {
    window.ui = SwaggerUIBundle({
      spec: ${JSON.stringify(swaggerDocument)},
      deepLink: true,
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      plugin: [
        SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: "StandaloneLayout",
      explorer: true,
    });
  };`;
  const html = swaggerUiDist.getAbsoluteFSPath() + "index.html";
  res.type("html").send(
    fs.readFileSync(html, "utf8")
      .replace("</body>", `<script>${initJS}</script></body>`)
  );
});

router.use("/swagger-ui-bundle.js", (_req, res) => {
  res.type("application/javascript")
     .sendFile(swaggerUiDist.getAbsoluteFSPath() + "swagger-ui-bundle.js");
});
router.use("/swagger-ui-standalone-preset.js", (_req, res) => {
  res.type("application/javascript")
     .sendFile(swaggerUiDist.getAbsoluteFSPath() + "swagger-ui-standalone-preset.js");
});
router.use("/swagger-ui.css", (_req, res) => {
  res.type("text/css")
     .sendFile(swaggerUiDist.getAbsoluteFSPath() + "swagger-ui.css");
});
router.use("/favicon-32x32.png", (_req, res) => {
  res.type("image/png").sendFile(swaggerUiDist.getAbsoluteFSPath() + "favicon-32x32.png");
});
router.use("/favicon-16x16.png", (_req, res) => {
  res.type("image/png").sendFile(swaggerUiDist.getAbsoluteFSPath() + "favicon-16x16.png");
});

export default router;
