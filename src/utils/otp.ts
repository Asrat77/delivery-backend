import bcrypt from "bcrypt";
import { getEnv } from "../config/env";

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(otp: string) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp: string, otpHash: string) {
  return bcrypt.compare(otp, otpHash);
}

export function otpExpiresAt(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export const MOCK_OTP_CODE = "123456";

export function isMockSmsProvider(): boolean {
  return getEnv().SMS_PROVIDER === "mock";
}

export function isMockOtp(otp: string): boolean {
  return isMockSmsProvider() && otp === MOCK_OTP_CODE;
}

