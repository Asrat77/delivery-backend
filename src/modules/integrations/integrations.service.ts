import { prisma } from "../../config/prisma";
import { getMockQuote, createMockShipment } from "./providers/dhl.mock-provider";

export async function listProviders() {
  return [{ id: "DHL", name: "DHL (mock)" }, { id: "MOCK", name: "Mock" }];
}

export async function dhlQuote(input: { weight: number; from: string; to: string }) {
  const response = await getMockQuote(input);
  await prisma.thirdPartyIntegrationLog.create({
    data: {
      provider: "DHL",
      status: "SUCCESS",
      requestPayload: input as any,
      responsePayload: response as any,
    },
  });
  return response;
}

export async function dhlCreateShipment(input: { shipmentId: string }) {
  const shipment = await prisma.shipment.findUnique({ where: { id: input.shipmentId }, select: { id: true, trackingNumber: true } });
  if (!shipment) throw new Error("Shipment not found");

  const response = await createMockShipment({ trackingNumber: shipment.trackingNumber });
  await prisma.thirdPartyIntegrationLog.create({
    data: {
      shipmentId: shipment.id,
      provider: "DHL",
      status: "SUCCESS",
      requestPayload: input as any,
      responsePayload: response as any,
    },
  });
  return response;
}

