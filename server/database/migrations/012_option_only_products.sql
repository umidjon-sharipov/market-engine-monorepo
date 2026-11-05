ALTER TABLE "Products"
  ADD COLUMN IF NOT EXISTS "isOptionOnly" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "Products" AS product
SET "isOptionOnly" = TRUE
WHERE EXISTS (
  SELECT 1
  FROM "ProductOptionItems" AS option_item
  WHERE option_item."includeProductId" = product.id
);
