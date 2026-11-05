-- Run after taking a database backup.

ALTER TABLE "Discounts"
  ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION;

ALTER TABLE "Discounts"
  ADD CONSTRAINT discounts_percentage_range
    CHECK (percentage >= 0 AND percentage <= 100),
  ADD CONSTRAINT discounts_amount_non_negative
    CHECK (amount IS NULL OR amount >= 0),
  ADD CONSTRAINT discounts_date_range
    CHECK ("endDate" > "startDate");

CREATE INDEX IF NOT EXISTS discounts_active_idx
  ON "Discounts" ("market", "startDate", "endDate");