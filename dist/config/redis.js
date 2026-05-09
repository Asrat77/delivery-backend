"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
const ioredis_1 = require("ioredis");
const env_1 = require("./env");
let redisClient = null;
function getRedis() {
    const env = (0, env_1.getEnv)();
    if (!env.REDIS_ENABLED)
        return null;
    if (!redisClient) {
        redisClient = new ioredis_1.Redis({
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            lazyConnect: true,
        });
    }
    return redisClient;
}
