-- Run after taking a database backup. This migration assumes relationship IDs contain valid UUIDs.
-- The application uses parameterized queries; these constraints protect data integrity at the DB boundary too.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Markets"
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Users"
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON "Users" (lower(email));

ALTER TABLE "Products"
  ALTER COLUMN "marketId" TYPE uuid USING NULLIF("marketId", '')::uuid,
  ALTER COLUMN "warehouseId" TYPE uuid USING NULLIF("warehouseId", '')::uuid,
  ALTER COLUMN "categoryId" TYPE uuid USING NULLIF("categoryId", '')::uuid,
  ALTER COLUMN "discountId" TYPE uuid USING NULLIF("discountId", '')::uuid;

ALTER TABLE "Sliders"
  ALTER COLUMN "marketId" TYPE uuid USING NULLIF("marketId", '')::uuid;

ALTER TABLE "Discounts"
  ALTER COLUMN market TYPE uuid USING NULLIF(market, '')::uuid;

ALTER TABLE "Warehouses"
  ALTER COLUMN "marketId" TYPE uuid USING NULLIF("marketId", '')::uuid;

ALTER TABLE "Categories"
  ALTER COLUMN "marketId" TYPE uuid USING NULLIF("marketId", '')::uuid;

ALTER TABLE "Workers"
  ALTER COLUMN "userId" TYPE uuid USING NULLIF("userId", '')::uuid,
  ALTER COLUMN "vacancyId" TYPE uuid USING NULLIF("vacancyId", '')::uuid;

ALTER TABLE "Products"
  ADD CONSTRAINT products_price_non_negative CHECK (price >= 0),
  ADD CONSTRAINT products_quantity_non_negative CHECK (quantity >= 0),
  ADD CONSTRAINT products_market_fk FOREIGN KEY ("marketId") REFERENCES "Markets" (id) ON DELETE CASCADE,
  ADD CONSTRAINT products_warehouse_fk FOREIGN KEY ("warehouseId") REFERENCES "Warehouses" (id) ON DELETE RESTRICT,
  ADD CONSTRAINT products_category_fk FOREIGN KEY ("categoryId") REFERENCES "Categories" (id) ON DELETE SET NULL,
  ADD CONSTRAINT products_discount_fk FOREIGN KEY ("discountId") REFERENCES "Discounts" (id) ON DELETE SET NULL;

ALTER TABLE "Sliders"
  ADD CONSTRAINT sliders_market_fk FOREIGN KEY ("marketId") REFERENCES "Markets" (id) ON DELETE CASCADE;

ALTER TABLE "Discounts"
  ADD CONSTRAINT discounts_percentage_valid CHECK (percentage >= 0 AND percentage <= 100),
  ADD CONSTRAINT discounts_dates_valid CHECK ("endDate" > "startDate"),
  ADD CONSTRAINT discounts_market_fk FOREIGN KEY (market) REFERENCES "Markets" (id) ON DELETE CASCADE;

ALTER TABLE "Warehouses"
  ADD CONSTRAINT warehouses_market_fk FOREIGN KEY ("marketId") REFERENCES "Markets" (id) ON DELETE CASCADE;

ALTER TABLE "Categories"
  ADD CONSTRAINT categories_market_fk FOREIGN KEY ("marketId") REFERENCES "Markets" (id) ON DELETE CASCADE;

ALTER TABLE "Workers"
  ADD CONSTRAINT workers_market_fk FOREIGN KEY ("marketId") REFERENCES "Markets" (id) ON DELETE CASCADE,
  ADD CONSTRAINT workers_user_fk FOREIGN KEY ("userId") REFERENCES "Users" (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS products_market_created_idx
  ON "Products" ("marketId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON "Products" ("categoryId");
CREATE INDEX IF NOT EXISTS sliders_market_created_idx
  ON "Sliders" ("marketId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS warehouses_market_idx ON "Warehouses" ("marketId");
CREATE INDEX IF NOT EXISTS categories_market_idx ON "Categories" ("marketId");
CREATE INDEX IF NOT EXISTS sessions_active_idx
  ON "UserSessions" (id, "userId") WHERE "isRevoked" = FALSE;
CREATE INDEX IF NOT EXISTS otps_active_idx
  ON "UserOtps" (email, "createdAt" DESC) WHERE "isUsed" = FALSE;