-- Buyer's GCash for a refund, asked only when a refund is due and
-- cleared once the admin records it (RA 10173 data minimization)
ALTER TABLE "seller_earnings" ADD COLUMN "refundGcashName" TEXT,
ADD COLUMN "refundGcashNumber" TEXT;
