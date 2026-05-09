"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeliveryProofByShipmentId = getDeliveryProofByShipmentId;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
async function getDeliveryProofByShipmentId(shipmentId) {
    const proof = await prisma_1.prisma.deliveryProof.findUnique({ where: { shipmentId } });
    if (!proof)
        throw new ApiError_1.ApiError(404, "Delivery proof not found");
    return {
        id: proof.id,
        type: proof.type,
        verified: proof.verified,
        verifiedAt: proof.verifiedAt,
        otpExpiresAt: proof.otpExpiresAt,
        photoUrl: proof.photoUrl,
    };
}
