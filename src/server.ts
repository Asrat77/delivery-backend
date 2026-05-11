import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { createSocketServer } from "./modules/live-tracking/live-tracking.socket";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

createSocketServer(server);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
});
