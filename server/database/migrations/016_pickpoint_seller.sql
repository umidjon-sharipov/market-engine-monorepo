ALTER TABLE "PickPoints"
  ADD COLUMN IF NOT EXISTS "assignedSellerId" UUID
    REFERENCES "Workers"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "PickPoints_assignedSellerId_idx"
  ON "PickPoints" ("assignedSellerId");
