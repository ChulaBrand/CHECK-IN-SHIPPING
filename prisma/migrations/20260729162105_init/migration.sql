-- CreateTable
CREATE TABLE "CheckIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverName" TEXT NOT NULL,
    "truckOrCompanyName" TEXT NOT NULL,
    "trailerPlates" TEXT NOT NULL,
    "driversLicense" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "loadingType" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "produceType" TEXT NOT NULL,
    "produceTypeOther" TEXT,
    "loadAccommodation" TEXT,
    "spNumberOrder" TEXT,
    "spNumberOrder2" TEXT,
    "entryTime" DATETIME,
    "forkliftAssigned" TEXT,
    "dockAssigned" TEXT,
    "palletCount" INTEGER,
    "checkOutTime" DATETIME
);

-- CreateIndex
CREATE INDEX "CheckIn_status_idx" ON "CheckIn"("status");

-- CreateIndex
CREATE INDEX "CheckIn_createdAt_idx" ON "CheckIn"("createdAt");
