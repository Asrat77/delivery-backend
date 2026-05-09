import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { getEnv } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { generateOtp, hashOtp, verifyOtp, otpExpiresAt, isMockOtp } from "../../utils/otp";
import { MockSmsProvider } from "../notifications/sms.provider";

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

function signToken(user: { id: string; role: string }): string {
  const env = getEnv();
  return jwt.sign({ role: user.role }, env.JWT_SECRET as Secret, {
    expiresIn: env.JWT_EXPIRES_IN as any,
    subject: user.id,
  } as any);
}

async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const env = getEnv();
  const provider = new MockSmsProvider();
  await provider.send({ to: phone, message: `Your verification code is: ${otp}` });
}

export async function sendRegistrationOtp(input: {
  name: string;
  email?: string;
  phone: string;
  password: string;
}) {
  const env = getEnv();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phone: input.phone }, ...(input.email ? [{ email: input.email }] : [])],
      deletedAt: null,
    },
  });
  if (existing) {
    if (existing.phone === input.phone) throw new ApiError(409, "Phone already registered");
    if (input.email && existing.email === input.email) throw new ApiError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = otpExpiresAt(10);

  await prisma.otpVerification.deleteMany({
    where: { phone: input.phone, purpose: "REGISTRATION" },
  });

  await prisma.otpVerification.create({
    data: {
      phone: input.phone,
      otpHash,
      expiresAt,
      purpose: "REGISTRATION",
      metadata: {
        name: input.name,
        email: input.email ?? null,
        passwordHash,
      },
    },
  });

  await sendOtpSms(input.phone, otp);

  return { phone: input.phone };
}

export async function verifyRegistrationOtp(input: { phone: string; otp: string }) {
  const record = await prisma.otpVerification.findFirst({
    where: { phone: input.phone, purpose: "REGISTRATION", verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new ApiError(400, "No OTP found. Request a new one.");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired. Request a new one.");

  const isValid = await verifyOtp(input.otp, record.otpHash);
  if (!isValid && !isMockOtp(input.otp)) {
    throw new ApiError(400, "Invalid OTP");
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verified: true, verifiedAt: new Date() },
  });

  const metadata = record.metadata as { name: string; email?: string | null; passwordHash: string };

  try {
    const user = await prisma.user.create({
      data: {
        name: metadata.name,
        email: metadata.email ?? undefined,
        phone: input.phone,
        passwordHash: metadata.passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
      },
      select: safeUserSelect(),
    });

    const token = signToken(user);
    return { user, token };
  } catch (e: any) {
    if (e?.code === "P2002") throw new ApiError(409, "User already exists", e?.meta ?? null);
    throw e;
  }
}

export async function sendLoginOtp(input: { emailOrPhone: string; password: string }) {
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

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = otpExpiresAt(10);

  await prisma.otpVerification.deleteMany({
    where: { phone: user.phone, purpose: "LOGIN" },
  });

  await prisma.otpVerification.create({
    data: {
      phone: user.phone,
      otpHash,
      expiresAt,
      purpose: "LOGIN",
    },
  });

  await sendOtpSms(user.phone, otp);

  return { phone: user.phone };
}

export async function verifyLoginOtp(input: { phone: string; otp: string }) {
  const record = await prisma.otpVerification.findFirst({
    where: { phone: input.phone, purpose: "LOGIN", verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new ApiError(400, "No OTP found. Request a new one.");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP expired. Request a new one.");

  const isValid = await verifyOtp(input.otp, record.otpHash);
  if (!isValid && !isMockOtp(input.otp)) {
    throw new ApiError(400, "Invalid OTP");
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verified: true, verifiedAt: new Date() },
  });

  const user = await prisma.user.findFirst({
    where: { phone: input.phone, deletedAt: null },
    select: safeUserSelect(),
  });

  if (!user) throw new ApiError(401, "User not found");
  if (user.status !== "ACTIVE") throw new ApiError(403, "User is inactive");

  const token = signToken(user);
  return { user, token };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect() });
  if (!user) throw new ApiError(404, "User not found");
  return user;
}
