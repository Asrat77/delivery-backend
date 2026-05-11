"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const live_tracking_socket_1 = require("./modules/live-tracking/live-tracking.socket");
dotenv_1.default.config();
const PORT = Number(process.env.PORT) || 4000;
const server = http_1.default.createServer(app_1.default);
(0, live_tracking_socket_1.createSocketServer)(server);
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
});
