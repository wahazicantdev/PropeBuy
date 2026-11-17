-- Refund record for cancelled online payments (E2E #441)
ALTER TABLE "seller_earnings" ADD COLUMN "refundReference" TEXT,
ADD COLUMN "refundedAt" TIMESTAMP(3);
