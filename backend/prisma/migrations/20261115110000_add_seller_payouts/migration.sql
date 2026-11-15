-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('ON_HOLD', 'AVAILABLE', 'PAID_OUT', 'REFUND_DUE', 'REFUNDED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "payoutGcashName" TEXT,
ADD COLUMN     "payoutGcashNumber" TEXT;

-- CreateTable
CREATE TABLE "seller_earnings" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "itemsAmount" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "withholdingTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'ON_HOLD',
    "payoutId" INTEGER,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "gcashName" TEXT NOT NULL,
    "gcashNumber" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seller_earnings_sellerId_status_idx" ON "seller_earnings"("sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "seller_earnings_orderId_sellerId_key" ON "seller_earnings"("orderId", "sellerId");

-- CreateIndex
CREATE INDEX "payouts_sellerId_idx" ON "payouts"("sellerId");

-- AddForeignKey
ALTER TABLE "seller_earnings" ADD CONSTRAINT "seller_earnings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_earnings" ADD CONSTRAINT "seller_earnings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_earnings" ADD CONSTRAINT "seller_earnings_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill: online payments made before this feature get their seller
-- shares too. 5% commission on items paid online, matching
-- COMMISSION_RATE in src/config/fees.js. Delivery fees go 100% to the seller.
INSERT INTO "seller_earnings" ("orderId", "sellerId", "itemsAmount", "deliveryFee", "commission", "netAmount", "status", "releasedAt")
SELECT s."orderId", s."sellerId", s.items, s.fee, s.commission, s.items + s.fee - s.commission,
  (CASE WHEN s.status = 'FULFILLED' THEN 'AVAILABLE' WHEN s.status = 'CANCELLED' THEN 'REFUND_DUE' ELSE 'ON_HOLD' END)::"EarningStatus",
  CASE WHEN s.status = 'FULFILLED' THEN COALESCE(s."fulfilledAt", s."updatedAt") END
FROM (
  SELECT o.id AS "orderId", p."sellerId", o.status, o."fulfilledAt", o."updatedAt",
    CASE WHEN o."paymentMethod" = 'GCASH' THEN SUM(oi.price * oi.quantity) ELSE 0 END AS items,
    CASE WHEN o."deliveryFeeStatus" = 'PAID' THEN o."deliveryFee" ELSE 0 END AS fee,
    CASE WHEN o."paymentMethod" = 'GCASH' THEN ROUND(SUM(oi.price * oi.quantity) * 0.05, 2) ELSE 0 END AS commission
  FROM "orders" o
  JOIN "order_items" oi ON oi."orderId" = o.id
  JOIN "products" p ON p.id = oi."productId"
  WHERE (o."paymentMethod" = 'GCASH' AND o."paymentStatus" = 'PAID') OR o."deliveryFeeStatus" = 'PAID'
  GROUP BY o.id, p."sellerId"
) s;
