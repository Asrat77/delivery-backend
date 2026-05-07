import { Redis } from "ioredis";
import { getEnv } from "./env";

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  const env = getEnv();
  if (!env.REDIS_ENABLED) return null;

  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  return redisClient;
}

