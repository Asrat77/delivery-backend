import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(20).default(12),

  REDIS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),

  APP_PUBLIC_URL: z.string().default("http://localhost:4000"),
  SMS_PROVIDER: z.string().default("mock"),
  OSRM_BASE_URL: z.string().default("https://router.project-osrm.org"),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.flatten();
    throw new Error(`Invalid environment variables: ${JSON.stringify(details)}`);
  }
  return parsed.data;
}

