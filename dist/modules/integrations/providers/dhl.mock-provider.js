"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockQuote = getMockQuote;
exports.createMockShipment = createMockShipment;
async function getMockQuote(input) {
    return {
        provider: "DHL",
        currency: "ETB",
        estimatedDays: 2,
        amount: Math.max(100, Math.round(input.weight * 50)),
        meta: input,
    };
}
async function createMockShipment(input) {
    return {
        provider: "DHL",
        providerShipmentId: `dhl-mock-${input.trackingNumber}`,
        status: "SUBMITTED",
    };
}
