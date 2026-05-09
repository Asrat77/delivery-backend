import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { hashOtp } from "../../utils/otp";

export async function createTestShipment(token: string, input?: Partial<any>) {
  const payload = {
    senderName: "Sender",
    senderPhone: "+251911111111",
    receiverName: "Receiver",
    receiverPhone: "+251922222222",
    pickupAddress: "Pickup Address",
    deliveryAddress: "Delivery Address",
    packageType: "SMALL",
    weight: 1,
    paymentMethod: "CASH",
    ...input,
  };

  const res = await request(app).post("/shipments").set("Authorization", `Bearer ${token}`).send(payload);
  return res;
}

export async function assignDriverToShipment(token: string, shipmentId: string, driverId: string) {
  const res = await request(app)
    .patch(`/shipments/${shipmentId}/assign-driver`)
    .set("Authorization", `Bearer ${token}`)
    .send({ driverId });
  return res;
}

export async function verifyShipmentOtp(token: string, shipmentId: string) {
  const otp = "12345";
  const otpHash = await hashOtp(otp);

  await prisma.deliveryProof.updateMany({
    where: { shipmentId },
    data: { otpCodeHash: otpHash, otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), verified: false, verifiedAt: null },
  });

  const res = await request(app).post(`/shipments/${shipmentId}/verify-otp`).set("Authorization", `Bearer ${token}`).send({ otp });
  return res;
}

export async function collectCod(token: string, shipmentId: string) {
  const res = await request(app).patch(`/cod/${shipmentId}/mark-collected`).set("Authorization", `Bearer ${token}`).send({});
  return res;
}

export async function markPaymentPaid(token: string, shipmentId: string) {
  const res = await request(app)
    .patch(`/payments/${shipmentId}/mark-paid`)
    .set("Authorization", `Bearer ${token}`)
    .send({ providerReference: "test" });
  return res;
}

