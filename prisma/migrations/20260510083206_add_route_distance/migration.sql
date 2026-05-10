-- Backfill NULL lat/lng with default location (Addis Ababa center)
UPDATE "Shipment" SET "pickupLat" = 9.0320 WHERE "pickupLat" IS NULL;
UPDATE "Shipment" SET "pickupLng" = 38.7469 WHERE "pickupLng" IS NULL;
UPDATE "Shipment" SET "deliveryLat" = 9.0320 WHERE "deliveryLat" IS NULL;
UPDATE "Shipment" SET "deliveryLng" = 38.7469 WHERE "deliveryLng" IS NULL;

-- Add new columns
ALTER TABLE "Shipment" ADD COLUMN "distanceMeters" INTEGER;
ALTER TABLE "Shipment" ADD COLUMN "durationSeconds" INTEGER;

-- Make lat/lng required now that they have values
ALTER TABLE "Shipment" ALTER COLUMN "pickupLat" SET NOT NULL;
ALTER TABLE "Shipment" ALTER COLUMN "pickupLng" SET NOT NULL;
ALTER TABLE "Shipment" ALTER COLUMN "deliveryLat" SET NOT NULL;
ALTER TABLE "Shipment" ALTER COLUMN "deliveryLng" SET NOT NULL;
