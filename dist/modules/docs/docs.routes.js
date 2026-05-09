"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_dist_1 = __importDefault(require("swagger-ui-dist"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
let swaggerDocument = null;
try {
    swaggerDocument = js_yaml_1.default.load(fs_1.default.readFileSync(path_1.default.join(__dirname, "../../../docs/swagger.yml"), "utf8"));
}
catch {
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
    const html = swagger_ui_dist_1.default.getAbsoluteFSPath() + "index.html";
    res.type("html").send(fs_1.default.readFileSync(html, "utf8")
        .replace("</body>", `<script>${initJS}</script></body>`));
});
router.use("/swagger-ui-bundle.js", (_req, res) => {
    res.type("application/javascript")
        .sendFile(swagger_ui_dist_1.default.getAbsoluteFSPath() + "swagger-ui-bundle.js");
});
router.use("/swagger-ui-standalone-preset.js", (_req, res) => {
    res.type("application/javascript")
        .sendFile(swagger_ui_dist_1.default.getAbsoluteFSPath() + "swagger-ui-standalone-preset.js");
});
router.use("/swagger-ui.css", (_req, res) => {
    res.type("text/css")
        .sendFile(swagger_ui_dist_1.default.getAbsoluteFSPath() + "swagger-ui.css");
});
router.use("/favicon-32x32.png", (_req, res) => {
    res.type("image/png").sendFile(swagger_ui_dist_1.default.getAbsoluteFSPath() + "favicon-32x32.png");
});
router.use("/favicon-16x16.png", (_req, res) => {
    res.type("image/png").sendFile(swagger_ui_dist_1.default.getAbsoluteFSPath() + "favicon-16x16.png");
});
exports.default = router;
