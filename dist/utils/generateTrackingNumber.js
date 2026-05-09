"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTrackingNumber = generateTrackingNumber;
function randomAlphaNum(length) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < length; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}
function generateTrackingNumber(now = new Date()) {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `DLV-${yyyy}${mm}${dd}-${randomAlphaNum(6)}`;
}
