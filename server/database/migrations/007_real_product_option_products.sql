-- Apply after 006_normalize_groups.sql. This preserves legacy option labels while
-- allowing new option items to reference warehouse-backed products.

ALTER TABLE "ProductOptions"
  ADD COLUMN IF NOT EXISTS "isOptional" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "searchEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "searchKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "ProductOptionItems"
  ADD COLUMN IF NOT EXISTS "includeProductId" UUID;

-- Old option rows have no product relation. Keep their old values nullable so
-- the application can safely ignore them while newly submitted rows use IDs.
ALTER TABLE "ProductOptionItems"
  ALTER COLUMN key DROP NOT NULL,
  ALTER COLUMN value DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_option_items_included_product_fk'
  ) THEN
    ALTER TABLE "ProductOptionItems"
      ADD CONSTRAINT product_option_items_included_product_fk
      FOREIGN KEY ("includeProductId") REFERENCES "Products"(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS product_option_items_included_product_idx
  ON "ProductOptionItems" ("includeProductId");

CREATE UNIQUE INDEX IF NOT EXISTS product_option_items_option_product_unique
  ON "ProductOptionItems" ("optionId", "includeProductId");
