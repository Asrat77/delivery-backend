-- CreateTable
CREATE TABLE "RouteSnapshot" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "distance" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "profile" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteSnapshot_shipmentId_key" ON "RouteSnapshot"("shipmentId");

-- CreateIndex
CREATE INDEX "RouteSnapshot_shipmentId_idx" ON "RouteSnapshot"("shipmentId");

-- AddForeignKey
ALTER TABLE "RouteSnapshot" ADD CONSTRAINT "RouteSnapshot_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
