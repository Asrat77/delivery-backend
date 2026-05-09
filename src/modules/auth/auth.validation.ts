import { z } from "zod";

export const registerSchema = {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(6),
    password: z.string().min(8).optional(),
  }),
};

export const verifyRegistrationSchema = {
  body: z.object({
    phone: z.string().min(6),
    otp: z.string().length(5),
  }),
};

export const loginSchema = {
  body: z.object({
    emailOrPhone: z.string().min(3),
    password: z.string().min(1).optional(),
  }),
};

export const verifyLoginSchema = {
  body: z.object({
    phone: z.string().min(6),
    otp: z.string().length(5),
  }),
};
