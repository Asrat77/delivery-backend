require("dotenv").config();
const { execSync } = require("child_process");

try {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
    timeout: 30000,
  });
} catch (e) {
  console.error("Migration failed:", e.message);
}

require("./dist/server.js");
