/*
  Warnings:

  - Added the required column `ratePerKm` to the `PricingRule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('BICYCLE', 'MOTORBIKE');

-- AlterTable
ALTER TABLE "PricingRule" ADD COLUMN     "baseFare" DECIMAL(10,2) NOT NULL DEFAULT 30,
ADD COLUMN     "deliveryType" "DeliveryType",
ADD COLUMN     "ratePerKm" DECIMAL(10,2) NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "deliveryType" "DeliveryType";

-- CreateIndex
CREATE INDEX "PricingRule_deliveryType_idx" ON "PricingRule"("deliveryType");
