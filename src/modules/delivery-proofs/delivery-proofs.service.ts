import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

export async function getDeliveryProofByShipmentId(shipmentId: string) {
  const proof = await prisma.deliveryProof.findUnique({ where: { shipmentId } });
  if (!proof) throw new ApiError(404, "Delivery proof not found");
  return {
    id: proof.id,
    type: proof.type,
    verified: proof.verified,
    verifiedAt: proof.verifiedAt,
    otpExpiresAt: proof.otpExpiresAt,
    photoUrl: proof.photoUrl,
  };
}

