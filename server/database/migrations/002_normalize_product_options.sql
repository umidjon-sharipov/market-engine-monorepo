-- Run after 001_production_hardening.sql and after taking a database backup.
-- Product options become real relations so Prisma can use nested create.

CREATE TABLE IF NOT EXISTS "ProductOptions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProductOptionItems" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "optionId" UUID NOT NULL REFERENCES "ProductOptions"(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS product_options_product_idx
  ON "ProductOptions" ("productId");
CREATE INDEX IF NOT EXISTS product_option_items_option_idx
  ON "ProductOptionItems" ("optionId");

-- Preserve existing JSON options before removing the legacy column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Products' AND column_name = 'options'
  ) THEN
    WITH legacy_options AS (
      SELECT
        p.id AS product_id,
        gen_random_uuid() AS option_id,
        option_value
      FROM "Products" p
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(p.options) = 'array' THEN p.options
          ELSE '[]'::jsonb
        END
      ) AS option_value
    ), inserted_options AS (
      INSERT INTO "ProductOptions" (id, "productId", title)
      SELECT option_id, product_id, COALESCE(option_value->>'title', 'Option')
      FROM legacy_options
      RETURNING id, "productId", title
    )
    INSERT INTO "ProductOptionItems" ("optionId", key, value)
    SELECT
      inserted.id,
      item->>'key',
      COALESCE((item->>'value')::double precision, 0)
    FROM inserted_options inserted
    JOIN "Products" product ON product.id = inserted."productId"
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(
        (
          SELECT option_value->'options'
          FROM jsonb_array_elements(product.options) option_value
          WHERE option_value->>'title' = inserted.title
          LIMIT 1
        ),
        '[]'::jsonb
      )
    ) AS item
    WHERE COALESCE(item->>'key', '') <> '';

    ALTER TABLE "Products" DROP COLUMN options;
  END IF;
END $$;
