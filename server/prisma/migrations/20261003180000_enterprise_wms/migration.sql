CREATE TYPE "MovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT');
CREATE TYPE "MovementStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Products"
  ADD COLUMN "categoryItemId" UUID;

ALTER TABLE "ProductOptions"
  ADD COLUMN "searchKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Products"
  ADD CONSTRAINT "Products_categoryItemId_fkey"
  FOREIGN KEY ("categoryItemId") REFERENCES "CategoryOptionItems"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Products_categoryItemId_idx" ON "Products"("categoryItemId");

CREATE TABLE "WarehouseZones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "warehouseId" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseZones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WarehouseZones_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WarehouseZones_warehouseId_code_key"
  ON "WarehouseZones"("warehouseId", "code");
CREATE INDEX "WarehouseZones_warehouseId_idx"
  ON "WarehouseZones"("warehouseId");

CREATE TABLE "StorageBins" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "zoneId" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StorageBins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StorageBins_zoneId_fkey"
    FOREIGN KEY ("zoneId") REFERENCES "WarehouseZones"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StorageBins_code_key" ON "StorageBins"("code");
CREATE INDEX "StorageBins_zoneId_idx" ON "StorageBins"("zoneId");

CREATE TABLE "WarehouseInventories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL,
  "warehouseId" UUID NOT NULL,
  "binId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "WarehouseInventories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WarehouseInventories_quantity_check"
    CHECK ("quantity" >= 0 AND "reservedQuantity" >= 0 AND "reservedQuantity" <= "quantity"),
  CONSTRAINT "WarehouseInventories_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WarehouseInventories_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WarehouseInventories_binId_fkey"
    FOREIGN KEY ("binId") REFERENCES "StorageBins"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WarehouseInventories_productId_binId_key"
  ON "WarehouseInventories"("productId", "binId");
CREATE INDEX "WarehouseInventories_warehouseId_binId_idx"
  ON "WarehouseInventories"("warehouseId", "binId");

CREATE TABLE "StockMovements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL,
  "type" "MovementType" NOT NULL,
  "status" "MovementStatus" NOT NULL DEFAULT 'PENDING',
  "quantity" INTEGER NOT NULL,
  "fromWarehouseId" UUID,
  "fromBinId" UUID,
  "toWarehouseId" UUID,
  "toBinId" UUID,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(6),
  CONSTRAINT "StockMovements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockMovements_quantity_check" CHECK ("quantity" >= 0),
  CONSTRAINT "StockMovements_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Products"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockMovements_fromWarehouseId_fkey"
    FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockMovements_fromBinId_fkey"
    FOREIGN KEY ("fromBinId") REFERENCES "StorageBins"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockMovements_toWarehouseId_fkey"
    FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StockMovements_toBinId_fkey"
    FOREIGN KEY ("toBinId") REFERENCES "StorageBins"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "StockMovements_productId_createdAt_idx"
  ON "StockMovements"("productId", "createdAt" DESC);
CREATE INDEX "StockMovements_status_createdAt_idx"
  ON "StockMovements"("status", "createdAt");

CREATE TABLE "OrderStockReservations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "warehouseId" UUID NOT NULL,
  "binId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMPTZ(6),
  CONSTRAINT "OrderStockReservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderStockReservations_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "OrderStockReservations_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderStockReservations_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Products"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderStockReservations_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouses"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderStockReservations_binId_fkey"
    FOREIGN KEY ("binId") REFERENCES "StorageBins"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "OrderStockReservations_orderId_idx"
  ON "OrderStockReservations"("orderId");
CREATE INDEX "OrderStockReservations_productId_binId_idx"
  ON "OrderStockReservations"("productId", "binId");
