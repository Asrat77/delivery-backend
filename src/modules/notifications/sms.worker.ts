import { Worker } from "bullmq";
import { getRedis } from "../../config/redis";
import { prisma } from "../../config/prisma";
import { MockSmsProvider } from "./sms.provider";

// Optional worker. Only start this in a separate process when REDIS_ENABLED=true.
export function startSmsWorker() {
  const redis = getRedis();
  if (!redis) return null;

  const provider = new MockSmsProvider();
  return new Worker(
    "sms",
    async (job) => {
      const { notificationId } = job.data as { notificationId: string };
      const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notification) return;
      if (!notification.recipientPhone) return;

      try {
        await provider.send({ to: notification.recipientPhone, message: notification.message });
        await prisma.notification.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date() } });
      } catch (e: any) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "FAILED", failureReason: e?.message ?? "SMS send failed" },
        });
      }
    },
    { connection: redis },
  );
}

