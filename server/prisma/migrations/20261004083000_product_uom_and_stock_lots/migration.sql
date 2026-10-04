CREATE TYPE "UnitOfMeasure" AS ENUM ('PCS', 'KG', 'LITRE', 'METER');

ALTER TABLE "Products"
  ALTER COLUMN "warehouseId" DROP NOT NULL,
  ALTER COLUMN "quantity" TYPE DOUBLE PRECISION USING "quantity"::DOUBLE PRECISION,
  ADD COLUMN "uom" "UnitOfMeasure" NOT NULL DEFAULT 'PCS';

ALTER TABLE "ProductOptions"
  ADD COLUMN "searchEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "ProductOptions"
SET "searchEnabled" = TRUE
WHERE cardinality("searchKeys") > 0;

ALTER TABLE "ProductOptionItems"
  ADD COLUMN "image" TEXT;

ALTER TABLE "WarehouseInventories"
  DROP CONSTRAINT "WarehouseInventories_quantity_check",
  DROP CONSTRAINT "WarehouseInventories_productId_binId_key",
  ADD COLUMN "lotNumber" VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN "expiresAt" TIMESTAMPTZ(6),
  ADD COLUMN "discountId" UUID,
  ALTER COLUMN "quantity" TYPE DOUBLE PRECISION USING "quantity"::DOUBLE PRECISION,
  ALTER COLUMN "reservedQuantity" TYPE DOUBLE PRECISION USING "reservedQuantity"::DOUBLE PRECISION,
  ADD CONSTRAINT "WarehouseInventories_quantity_check"
    CHECK ("quantity" >= 0 AND "reservedQuantity" >= 0 AND "reservedQuantity" <= "quantity"),
  ADD CONSTRAINT "WarehouseInventories_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "Discounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "WarehouseInventories_productId_binId_lotNumber_key"
  ON "WarehouseInventories"("productId", "binId", "lotNumber");

ALTER TABLE "StockMovements"
  DROP CONSTRAINT "StockMovements_quantity_check",
  ADD COLUMN "lotNumber" VARCHAR(100),
  ADD COLUMN "expiresAt" TIMESTAMPTZ(6),
  ADD COLUMN "discountId" UUID,
  ALTER COLUMN "quantity" TYPE DOUBLE PRECISION USING "quantity"::DOUBLE PRECISION,
  ADD CONSTRAINT "StockMovements_quantity_check" CHECK ("quantity" >= 0),
  ADD CONSTRAINT "StockMovements_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "Discounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderStockReservations"
  ADD COLUMN "lotNumber" VARCHAR(100) NOT NULL DEFAULT '',
  ALTER COLUMN "quantity" TYPE DOUBLE PRECISION USING "quantity"::DOUBLE PRECISION;
