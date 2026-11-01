ALTER TABLE "Orders"
  ADD COLUMN IF NOT EXISTS "checkoutId" UUID,
  ADD COLUMN IF NOT EXISTS "marketId" UUID,
  ADD COLUMN IF NOT EXISTS "deliveryLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deliveryLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "pickPointId" UUID,
  ADD COLUMN IF NOT EXISTS total DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Orders" AS order_record
SET "marketId" = (
  SELECT warehouse."marketId"
  FROM "OrderStockReservations" AS reservation
  INNER JOIN "Warehouses" AS warehouse ON warehouse.id = reservation."warehouseId"
  WHERE reservation."orderId" = order_record.id
  ORDER BY reservation."createdAt" ASC
  LIMIT 1
)
WHERE order_record."marketId" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_market_fk') THEN
    ALTER TABLE "Orders"
      ADD CONSTRAINT orders_market_fk
      FOREIGN KEY ("marketId") REFERENCES "Markets"(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_pick_point_fk') THEN
    ALTER TABLE "Orders"
      ADD CONSTRAINT orders_pick_point_fk
      FOREIGN KEY ("pickPointId") REFERENCES "PickPoints"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_market_status_created_idx
  ON "Orders" ("marketId", status, "createdAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_market_unique
  ON "Orders" ("checkoutId", "marketId");
