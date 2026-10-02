CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Markets_title_trgm_idx"
ON "Markets" USING GIN ("title" gin_trgm_ops);

ALTER TABLE "Followings"
  ADD COLUMN "follow" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "block" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Followings"
SET "follow" = CASE
  WHEN "isFollowing" THEN jsonb_build_array(to_jsonb("createdAt"))
  ELSE '[]'::jsonb
END,
"block" = CASE
  WHEN "isBlocked" THEN jsonb_build_array(to_jsonb("updatedAt"))
  ELSE '[]'::jsonb
END;

ALTER TABLE "Followings"
  DROP COLUMN "isFollowing",
  DROP COLUMN "isBlocked";

DROP INDEX IF EXISTS "Followings_marketId_isFollowing_idx";
DROP INDEX IF EXISTS "Followings_userId_isFollowing_idx";

CREATE INDEX "Followings_marketId_updatedAt_idx"
ON "Followings" ("marketId", "updatedAt" DESC);

CREATE INDEX "Followings_userId_updatedAt_idx"
ON "Followings" ("userId", "updatedAt" DESC);
