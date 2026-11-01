ALTER TABLE "OrderStockReservations"
  ADD COLUMN IF NOT EXISTS "fulfilledAt" TIMESTAMPTZ(6);
