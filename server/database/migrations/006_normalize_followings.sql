-- Run after taking a database backup.
-- Follow state is normalized from Followers.following JSONB into Followings.

CREATE TABLE IF NOT EXISTS "Followings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "marketId" UUID NOT NULL REFERENCES "Markets"(id) ON DELETE CASCADE,
  "isFollowing" BOOLEAN NOT NULL DEFAULT TRUE,
  "isBlocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT followings_user_market_unique UNIQUE ("userId", "marketId")
);

CREATE INDEX IF NOT EXISTS followings_market_following_idx
  ON "Followings" ("marketId", "isFollowing");
CREATE INDEX IF NOT EXISTS followings_user_following_idx
  ON "Followings" ("userId", "isFollowing");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Followers') THEN
    INSERT INTO "Followings" ("userId", "marketId", "isFollowing", "isBlocked")
    SELECT
      f."userId"::uuid,
      item->>'id',
      COALESCE(jsonb_array_length(item->'following') % 2 = 1, FALSE),
      COALESCE(jsonb_array_length(item->'isBlocked') > 0, FALSE)
    FROM "Followers" f
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(f.following) = 'array' THEN f.following ELSE '[]'::jsonb END
    ) item
    WHERE (item->>'id')::uuid IS NOT NULL
    ON CONFLICT ("userId", "marketId") DO UPDATE SET
      "isFollowing" = EXCLUDED."isFollowing",
      "isBlocked" = EXCLUDED."isBlocked";
  END IF;
END $$;