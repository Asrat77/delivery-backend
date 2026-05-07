export async function getMockQuote(input: { weight: number; from: string; to: string }) {
  return {
    provider: "DHL",
    currency: "ETB",
    estimatedDays: 2,
    amount: Math.max(100, Math.round(input.weight * 50)),
    meta: input,
  };
}

export async function createMockShipment(input: { trackingNumber: string }) {
  return {
    provider: "DHL",
    providerShipmentId: `dhl-mock-${input.trackingNumber}`,
    status: "SUBMITTED",
  };
}

