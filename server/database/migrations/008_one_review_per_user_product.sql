-- Keep the latest review for each user/product pair before enforcing upsert semantics.
WITH ranked_comments AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "productId", "user"
      ORDER BY "createdAt" DESC, id DESC
    ) AS position
  FROM "Comments"
)
DELETE FROM "Comments" AS comment
USING ranked_comments
WHERE comment.id = ranked_comments.id
  AND ranked_comments.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS comments_product_user_unique
  ON "Comments" ("productId", "user");
