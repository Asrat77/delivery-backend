-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('DAMAGED_ITEM', 'MISSING_ITEM', 'LATE_DELIVERY', 'WRONG_ADDRESS', 'PACKAGE_NOT_RECEIVED', 'OTHER');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "issueType" "IssueType" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_trackingNumber_idx" ON "Issue"("trackingNumber");

-- CreateIndex
CREATE INDEX "Issue_issueType_idx" ON "Issue"("issueType");

-- CreateIndex
CREATE INDEX "Issue_userId_idx" ON "Issue"("userId");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
