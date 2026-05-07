import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

function safeUserSelect() {
  return {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

export async function registerCustomer(input: {
  name: string;
  email?: string;
  phone: string;
  password: string;
}) {
  const env = getEnv();
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
      },
      select: safeUserSelect(),
    });

    const token = jwt.sign({ role: user.role }, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRES_IN as any,
      subject: user.id,
    } as any);

    return { user, token };
  } catch (e: any) {
    // Prisma unique violations are surfaced as P2002
    if (e?.code === "P2002") throw new ApiError(409, "User already exists", e?.meta ?? null);
    throw e;
  }
}

export async function login(input: { emailOrPhone: string; password: string }) {
  const env = getEnv();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.emailOrPhone }, { phone: input.emailOrPhone }],
      deletedAt: null,
    },
  });

  if (!user) throw new ApiError(401, "Invalid credentials");
  if (user.status !== "ACTIVE") throw new ApiError(403, "User is inactive");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET as Secret, {
    expiresIn: env.JWT_EXPIRES_IN as any,
    subject: user.id,
  } as any);

  const safeUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect() });
  if (!safeUser) throw new ApiError(401, "Invalid credentials");

  return { user: safeUser, token };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect() });
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

