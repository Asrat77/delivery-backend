"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmsQueue = getSmsQueue;
// (intentionally duplicate path check)
const bullmq_1 = require("bullmq");
const env_1 = require("../../config/env");
const redis_1 = require("../../config/redis");
let smsQueue = null;
function getSmsQueue() {
    const env = (0, env_1.getEnv)();
    if (!env.REDIS_ENABLED)
        return null;
    if (!smsQueue) {
        const redis = (0, redis_1.getRedis)();
        if (!redis)
            return null;
        smsQueue = new bullmq_1.Queue("sms", { connection: redis });
    }
    return smsQueue;
}
