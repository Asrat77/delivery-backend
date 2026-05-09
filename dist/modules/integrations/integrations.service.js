"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProviders = listProviders;
exports.dhlQuote = dhlQuote;
exports.dhlCreateShipment = dhlCreateShipment;
const prisma_1 = require("../../config/prisma");
const dhl_mock_provider_1 = require("./providers/dhl.mock-provider");
async function listProviders() {
    return [{ id: "DHL", name: "DHL (mock)" }, { id: "MOCK", name: "Mock" }];
}
async function dhlQuote(input) {
    const response = await (0, dhl_mock_provider_1.getMockQuote)(input);
    await prisma_1.prisma.thirdPartyIntegrationLog.create({
        data: {
            provider: "DHL",
            status: "SUCCESS",
            requestPayload: input,
            responsePayload: response,
        },
    });
    return response;
}
async function dhlCreateShipment(input) {
    const shipment = await prisma_1.prisma.shipment.findUnique({ where: { id: input.shipmentId }, select: { id: true, trackingNumber: true } });
    if (!shipment)
        throw new Error("Shipment not found");
    const response = await (0, dhl_mock_provider_1.createMockShipment)({ trackingNumber: shipment.trackingNumber });
    await prisma_1.prisma.thirdPartyIntegrationLog.create({
        data: {
            shipmentId: shipment.id,
            provider: "DHL",
            status: "SUCCESS",
            requestPayload: input,
            responsePayload: response,
        },
    });
    return response;
}
