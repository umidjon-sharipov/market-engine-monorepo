ALTER TABLE "Warehouses"
ADD COLUMN "code" VARCHAR(100),
ADD COLUMN "address" TEXT;

CREATE UNIQUE INDEX "Warehouses_marketId_code_key"
ON "Warehouses"("marketId", "code");
