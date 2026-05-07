// (intentionally duplicate path check)
import { Queue } from "bullmq";
import { getEnv } from "../../config/env";
import { getRedis } from "../../config/redis";

export type SmsJob = {
  notificationId: string;
};

let smsQueue: Queue<SmsJob> | null = null;

export function getSmsQueue(): Queue<SmsJob> | null {
  const env = getEnv();
  if (!env.REDIS_ENABLED) return null;

  if (!smsQueue) {
    const redis = getRedis();
    if (!redis) return null;
    smsQueue = new Queue<SmsJob>("sms", { connection: redis });
  }

  return smsQueue;
}

