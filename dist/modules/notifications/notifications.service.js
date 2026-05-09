"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndDispatchNotification = createAndDispatchNotification;
const prisma_1 = require("../../config/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const sms_provider_1 = require("./sms.provider");
const sms_queue_1 = require("./sms.queue");
async function createAndDispatchNotification(input) {
    const env = (0, env_1.getEnv)();
    const notification = await prisma_1.prisma.notification.create({
        data: {
            userId: input.userId ?? null,
            shipmentId: input.shipmentId ?? null,
            type: input.type,
            message: input.message,
            recipientPhone: input.recipientPhone ?? null,
            status: "PENDING",
        },
    });
    // If no recipient phone, keep record only.
    if (!notification.recipientPhone)
        return notification;
    if (!env.REDIS_ENABLED) {
        const provider = new sms_provider_1.MockSmsProvider();
        try {
            await provider.send({ to: notification.recipientPhone, message: notification.message });
            return prisma_1.prisma.notification.update({
                where: { id: notification.id },
                data: { status: "SENT", sentAt: new Date() },
            });
        }
        catch (e) {
            return prisma_1.prisma.notification.update({
                where: { id: notification.id },
                data: { status: "FAILED", failureReason: e?.message ?? "SMS send failed" },
            });
        }
    }
    const queue = (0, sms_queue_1.getSmsQueue)();
    if (!queue)
        throw new ApiError_1.ApiError(500, "SMS queue is not available");
    await queue.add("send", { notificationId: notification.id });
    return notification;
}
