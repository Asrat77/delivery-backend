-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DOMESTIC', 'INTERNATIONAL');

-- Set default for existing NULL deliveryType values before making it required
UPDATE "Shipment" SET "deliveryType" = 'MOTORBIKE' WHERE "deliveryType" IS NULL;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'DOMESTIC';
ALTER TABLE "Shipment" ALTER COLUMN "deliveryType" SET NOT NULL;
ALTER TABLE "Shipment" ALTER COLUMN "deliveryType" SET DEFAULT 'MOTORBIKE';

-- CreateIndex
CREATE INDEX "Shipment_serviceType_idx" ON "Shipment"("serviceType");
