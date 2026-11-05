-- Product ownership is market-wide; warehouse placement and availability live
-- in WarehouseInventories, which supports the same product in multiple sites.
ALTER TABLE "Products"
  DROP COLUMN IF EXISTS "warehouseId";
