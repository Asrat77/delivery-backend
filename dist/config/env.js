"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().int().min(4).max(20).default(12),
    REDIS_ENABLED: zod_1.z
        .string()
        .optional()
        .transform((v) => v === "true"),
    REDIS_HOST: zod_1.z.string().default("localhost"),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    APP_PUBLIC_URL: zod_1.z.string().default("http://localhost:4000"),
    SMS_PROVIDER: zod_1.z.string().default("mock"),
    OSRM_BASE_URL: zod_1.z.string().default("https://router.project-osrm.org"),
});
function getEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const details = parsed.error.flatten();
        throw new Error(`Invalid environment variables: ${JSON.stringify(details)}`);
    }
    return parsed.data;
}
