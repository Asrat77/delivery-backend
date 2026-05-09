"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRegistrationOtp = sendRegistrationOtp;
exports.verifyRegistrationOtp = verifyRegistrationOtp;
exports.sendLoginOtp = sendLoginOtp;
exports.verifyLoginOtp = verifyLoginOtp;
exports.me = me;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../config/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const otp_1 = require("../../utils/otp");
const sms_provider_1 = require("../notifications/sms.provider");
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
    };
}
function signToken(user) {
    const env = (0, env_1.getEnv)();
    return jsonwebtoken_1.default.sign({ role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
        subject: user.id,
    });
}
async function sendOtpSms(phone, otp) {
    const provider = new sms_provider_1.MockSmsProvider();
    await provider.send({ to: phone, message: `Your verification code is: ${otp}` });
}
async function generatePasswordHash(password, env) {
    if (password)
        return bcrypt_1.default.hash(password, env.BCRYPT_SALT_ROUNDS);
    return bcrypt_1.default.hash(String(Math.random()), env.BCRYPT_SALT_ROUNDS);
}
async function sendRegistrationOtp(input) {
    const env = (0, env_1.getEnv)();
    const existing = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ phone: input.phone }, ...(input.email ? [{ email: input.email }] : [])],
            deletedAt: null,
        },
    });
    if (existing) {
        if (existing.phone === input.phone)
            throw new ApiError_1.ApiError(409, "Phone already registered");
        if (input.email && existing.email === input.email)
            throw new ApiError_1.ApiError(409, "Email already registered");
    }
    const passwordHash = await generatePasswordHash(input.password, env);
    const otp = (0, otp_1.generateOtp)();
    const otpHash = await (0, otp_1.hashOtp)(otp);
    const expiresAt = (0, otp_1.otpExpiresAt)(10);
    await prisma_1.prisma.otpVerification.deleteMany({
        where: { phone: input.phone, purpose: "REGISTRATION" },
    });
    await prisma_1.prisma.otpVerification.create({
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
async function verifyRegistrationOtp(input) {
    const record = await prisma_1.prisma.otpVerification.findFirst({
        where: { phone: input.phone, purpose: "REGISTRATION", verified: false },
        orderBy: { createdAt: "desc" },
    });
    if (!record)
        throw new ApiError_1.ApiError(400, "No OTP found. Request a new one.");
    if (record.expiresAt < new Date())
        throw new ApiError_1.ApiError(400, "OTP expired. Request a new one.");
    const isValid = await (0, otp_1.verifyOtp)(input.otp, record.otpHash);
    if (!isValid && !(0, otp_1.isMockOtp)(input.otp)) {
        throw new ApiError_1.ApiError(400, "Invalid OTP");
    }
    await prisma_1.prisma.otpVerification.update({
        where: { id: record.id },
        data: { verified: true, verifiedAt: new Date() },
    });
    const metadata = record.metadata;
    try {
        const user = await prisma_1.prisma.user.create({
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
    }
    catch (e) {
        if (e?.code === "P2002")
            throw new ApiError_1.ApiError(409, "User already exists", e?.meta ?? null);
        throw e;
    }
}
async function sendLoginOtp(input) {
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ email: input.emailOrPhone }, { phone: input.emailOrPhone }],
            deletedAt: null,
        },
    });
    if (!user)
        throw new ApiError_1.ApiError(401, "Invalid credentials");
    if (user.status !== "ACTIVE")
        throw new ApiError_1.ApiError(403, "User is inactive");
    if (input.password !== undefined) {
        const ok = await bcrypt_1.default.compare(input.password, user.passwordHash);
        if (!ok)
            throw new ApiError_1.ApiError(401, "Invalid credentials");
    }
    const otp = (0, otp_1.generateOtp)();
    const otpHash = await (0, otp_1.hashOtp)(otp);
    const expiresAt = (0, otp_1.otpExpiresAt)(10);
    await prisma_1.prisma.otpVerification.deleteMany({
        where: { phone: user.phone, purpose: "LOGIN" },
    });
    await prisma_1.prisma.otpVerification.create({
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
async function verifyLoginOtp(input) {
    const record = await prisma_1.prisma.otpVerification.findFirst({
        where: { phone: input.phone, purpose: "LOGIN", verified: false },
        orderBy: { createdAt: "desc" },
    });
    if (!record)
        throw new ApiError_1.ApiError(400, "No OTP found. Request a new one.");
    if (record.expiresAt < new Date())
        throw new ApiError_1.ApiError(400, "OTP expired. Request a new one.");
    const isValid = await (0, otp_1.verifyOtp)(input.otp, record.otpHash);
    if (!isValid && !(0, otp_1.isMockOtp)(input.otp)) {
        throw new ApiError_1.ApiError(400, "Invalid OTP");
    }
    await prisma_1.prisma.otpVerification.update({
        where: { id: record.id },
        data: { verified: true, verifiedAt: new Date() },
    });
    const user = await prisma_1.prisma.user.findFirst({
        where: { phone: input.phone, deletedAt: null },
        select: safeUserSelect(),
    });
    if (!user)
        throw new ApiError_1.ApiError(401, "User not found");
    if (user.status !== "ACTIVE")
        throw new ApiError_1.ApiError(403, "User is inactive");
    const token = signToken(user);
    return { user, token };
}
async function me(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect() });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    return user;
}
