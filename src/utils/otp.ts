import bcrypt from "bcrypt";

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(otp: string) {
  // Separate from password hash cost. OTP hashes are short-lived.
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp: string, otpHash: string) {
  return bcrypt.compare(otp, otpHash);
}

export function otpExpiresAt(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

