-- CreateTable
CREATE TABLE "PopularRoute" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transitTime" TEXT NOT NULL,
    "pricing" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopularRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PopularRoute_origin_idx" ON "PopularRoute"("origin");

-- CreateIndex
CREATE INDEX "PopularRoute_destination_idx" ON "PopularRoute"("destination");
