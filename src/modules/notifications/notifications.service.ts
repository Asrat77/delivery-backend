import type { NotificationType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { MockSmsProvider } from "./sms.provider";
import { getSmsQueue } from "./sms.queue";

export async function createAndDispatchNotification(input: {
  userId?: string | null;
  shipmentId?: string | null;
  type: NotificationType;
  message: string;
  recipientPhone?: string | null;
}) {
  const env = getEnv();
  const notification = await prisma.notification.create({
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
  if (!notification.recipientPhone) return notification;

  if (!env.REDIS_ENABLED) {
    const provider = new MockSmsProvider();
    try {
      await provider.send({ to: notification.recipientPhone, message: notification.message });
      return prisma.notification.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (e: any) {
      return prisma.notification.update({
        where: { id: notification.id },
        data: { status: "FAILED", failureReason: e?.message ?? "SMS send failed" },
      });
    }
  }

  const queue = getSmsQueue();
  if (!queue) throw new ApiError(500, "SMS queue is not available");
  await queue.add("send", { notificationId: notification.id });
  return notification;
}

