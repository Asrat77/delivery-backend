"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_OTP_CODE = void 0;
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.verifyOtp = verifyOtp;
exports.otpExpiresAt = otpExpiresAt;
exports.isMockSmsProvider = isMockSmsProvider;
exports.isMockOtp = isMockOtp;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../config/env");
function generateOtp() {
    return String(Math.floor(10000 + Math.random() * 90000));
}
async function hashOtp(otp) {
    return bcrypt_1.default.hash(otp, 10);
}
async function verifyOtp(otp, otpHash) {
    return bcrypt_1.default.compare(otp, otpHash);
}
function otpExpiresAt(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
exports.MOCK_OTP_CODE = "12345";
function isMockSmsProvider() {
    return (0, env_1.getEnv)().SMS_PROVIDER === "mock";
}
function isMockOtp(otp) {
    return isMockSmsProvider() && otp === exports.MOCK_OTP_CODE;
}
