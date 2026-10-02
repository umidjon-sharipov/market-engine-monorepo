CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Markets_title_trgm_idx"
ON "Markets" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Followings_userId_isFollowing_updatedAt_idx"
ON "Followings" ("userId", "isFollowing", "updatedAt" DESC);
