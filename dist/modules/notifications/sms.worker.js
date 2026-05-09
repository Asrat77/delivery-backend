"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSmsWorker = startSmsWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
const prisma_1 = require("../../config/prisma");
const sms_provider_1 = require("./sms.provider");
// Optional worker. Only start this in a separate process when REDIS_ENABLED=true.
function startSmsWorker() {
    const redis = (0, redis_1.getRedis)();
    if (!redis)
        return null;
    const provider = new sms_provider_1.MockSmsProvider();
    return new bullmq_1.Worker("sms", async (job) => {
        const { notificationId } = job.data;
        const notification = await prisma_1.prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification)
            return;
        if (!notification.recipientPhone)
            return;
        try {
            await provider.send({ to: notification.recipientPhone, message: notification.message });
            await prisma_1.prisma.notification.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date() } });
        }
        catch (e) {
            await prisma_1.prisma.notification.update({
                where: { id: notification.id },
                data: { status: "FAILED", failureReason: e?.message ?? "SMS send failed" },
            });
        }
    }, { connection: redis });
}
