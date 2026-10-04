CREATE TABLE "PickPoints" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "serviceRadiusMeters" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PickPoints_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PickPoints_warehouseId_fkey" FOREIGN KEY ("warehouseId")
        REFERENCES "Warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PickPoints_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
    CONSTRAINT "PickPoints_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180),
    CONSTRAINT "PickPoints_serviceRadiusMeters_check" CHECK ("serviceRadiusMeters" > 0)
);

CREATE INDEX "PickPoints_warehouseId_idx" ON "PickPoints"("warehouseId");
