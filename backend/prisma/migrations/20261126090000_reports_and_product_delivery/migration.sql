-- 11-26: delivery fee per product from its weight, and buyer reports

-- Weight and delivery fee on each product
ALTER TABLE "products" ADD COLUMN "weightKg" DECIMAL(6,2) NOT NULL DEFAULT 1;
ALTER TABLE "products" ADD COLUMN "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Existing listings start at 1 kg and keep the seller's old flat fee,
-- capped at the fair maximum for 1 kg (PHP 30). Sellers can edit both.
UPDATE "products" p
SET "deliveryFee" = LEAST(u."deliveryFee", 30)
FROM "users" u
WHERE u."id" = p."sellerId";

-- Reports
CREATE TYPE "ReportReason" AS ENUM ('UNFAIR_DELIVERY_FEE', 'WRONG_WEIGHT', 'NOT_AS_DESCRIBED', 'PROHIBITED_ITEM', 'SCAM', 'SELLER_CONDUCT', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "productId" INTEGER,
    "orderId" INTEGER,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "action" TEXT,
    "adminNote" TEXT,
    "handledById" INTEGER,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");
CREATE INDEX "reports_sellerId_idx" ON "reports"("sellerId");

ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
