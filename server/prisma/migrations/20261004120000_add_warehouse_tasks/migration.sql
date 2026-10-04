CREATE TYPE "WarehouseTaskStatus" AS ENUM (
  'OPEN',
  'ASSIGNED',
  'PICKING',
  'PICKED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "WarehouseTasks" (
  "id" UUID NOT NULL,
  "marketId" UUID NOT NULL,
  "assignedWorkerId" UUID,
  "creatorWorkerId" UUID,
  "pickerWorkerId" UUID,
  "transporterWorkerId" UUID,
  "warehouseId" UUID NOT NULL,
  "sourceBinId" UUID NOT NULL,
  "destinationWarehouseId" UUID,
  "destinationBinId" UUID,
  "productId" UUID NOT NULL,
  "optionItemId" UUID,
  "orderId" UUID,
  "reservationId" UUID,
  "quantity" DOUBLE PRECISION NOT NULL,
  "status" "WarehouseTaskStatus" NOT NULL DEFAULT 'ASSIGNED',
  "note" TEXT,
  "assignedAt" TIMESTAMPTZ(6),
  "startedAt" TIMESTAMPTZ(6),
  "pickedAt" TIMESTAMPTZ(6),
  "transportedAt" TIMESTAMPTZ(6),
  "completedAt" TIMESTAMPTZ(6),
  "cancelledAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "WarehouseTasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WarehouseTasks_reservationId_key"
  ON "WarehouseTasks"("reservationId");
CREATE INDEX "WarehouseTasks_marketId_status_createdAt_idx"
  ON "WarehouseTasks"("marketId", "status", "createdAt" DESC);
CREATE INDEX "WarehouseTasks_assignedWorkerId_status_idx"
  ON "WarehouseTasks"("assignedWorkerId", "status");
CREATE INDEX "WarehouseTasks_productId_idx"
  ON "WarehouseTasks"("productId");
CREATE INDEX "WarehouseTasks_orderId_idx"
  ON "WarehouseTasks"("orderId");

ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_assignedWorkerId_fkey"
  FOREIGN KEY ("assignedWorkerId") REFERENCES "Workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_creatorWorkerId_fkey"
  FOREIGN KEY ("creatorWorkerId") REFERENCES "Workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_pickerWorkerId_fkey"
  FOREIGN KEY ("pickerWorkerId") REFERENCES "Workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_transporterWorkerId_fkey"
  FOREIGN KEY ("transporterWorkerId") REFERENCES "Workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "Warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_sourceBinId_fkey"
  FOREIGN KEY ("sourceBinId") REFERENCES "StorageBins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_destinationWarehouseId_fkey"
  FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_destinationBinId_fkey"
  FOREIGN KEY ("destinationBinId") REFERENCES "StorageBins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_optionItemId_fkey"
  FOREIGN KEY ("optionItemId") REFERENCES "ProductOptionItems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WarehouseTasks"
  ADD CONSTRAINT "WarehouseTasks_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "OrderStockReservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
