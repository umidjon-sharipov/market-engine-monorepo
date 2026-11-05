-- Run after taking a database backup.
-- Existing comment references must contain valid UUID values before this migration.

ALTER TABLE "Comments"
  ALTER COLUMN "user" TYPE uuid USING NULLIF("user", '')::uuid,
  ALTER COLUMN "productId" TYPE uuid USING NULLIF("productId", '')::uuid;

ALTER TABLE "Comments"
  ADD CONSTRAINT comments_user_fk
    FOREIGN KEY ("user") REFERENCES "Users"(id) ON DELETE CASCADE,
  ADD CONSTRAINT comments_product_fk
    FOREIGN KEY ("productId") REFERENCES "Products"(id) ON DELETE CASCADE,
  ADD CONSTRAINT comments_rate_valid CHECK (rate BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS comments_user_created_idx
  ON "Comments" ("user", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS comments_product_created_idx
  ON "Comments" ("productId", "createdAt" DESC);