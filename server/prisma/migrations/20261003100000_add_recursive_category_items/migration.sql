ALTER TABLE "Categories"
  ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CategoryOptions"
  ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CategoryOptionItems"
  ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "optionId" DROP NOT NULL,
  ADD COLUMN "parentId" UUID;

ALTER TABLE "CategoryOptionItems"
  ADD CONSTRAINT "CategoryOptionItems_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "CategoryOptionItems"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CategoryOptionItems_parentId_idx"
  ON "CategoryOptionItems"("parentId");
