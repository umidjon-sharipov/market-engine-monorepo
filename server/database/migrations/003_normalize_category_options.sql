-- Run after taking a database backup.
-- Category.options JSONB becomes CategoryOptions/CategoryOptionItems relations.

CREATE TABLE IF NOT EXISTS "CategoryOptions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoryId" UUID NOT NULL REFERENCES "Categories"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CategoryOptionItems" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "optionId" UUID NOT NULL REFERENCES "CategoryOptions"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  image TEXT
);

CREATE INDEX IF NOT EXISTS category_options_category_idx
  ON "CategoryOptions" ("categoryId");
CREATE INDEX IF NOT EXISTS category_option_items_option_idx
  ON "CategoryOptionItems" ("optionId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Categories' AND column_name = 'options'
  ) THEN
    WITH legacy_options AS (
      SELECT c.id AS category_id, option_value
      FROM "Categories" c
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(c.options) = 'array' THEN c.options ELSE '[]'::jsonb END
      ) AS option_value
    ), inserted_options AS (
      INSERT INTO "CategoryOptions" ("categoryId", title)
      SELECT category_id, COALESCE(option_value->>'title', 'Option')
      FROM legacy_options
      RETURNING id, "categoryId", title
    )
    INSERT INTO "CategoryOptionItems" ("optionId", title, image)
    SELECT inserted.id, item->>'title', NULLIF(item->>'image', '')
    FROM inserted_options inserted
    JOIN "Categories" category ON category.id = inserted."categoryId"
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE((
        SELECT option_value->'items'
        FROM jsonb_array_elements(category.options) option_value
        WHERE option_value->>'title' = inserted.title
        LIMIT 1
      ), '[]'::jsonb)
    ) AS item
    WHERE COALESCE(item->>'title', '') <> '';

    ALTER TABLE "Categories" DROP COLUMN options;
  END IF;
END $$;