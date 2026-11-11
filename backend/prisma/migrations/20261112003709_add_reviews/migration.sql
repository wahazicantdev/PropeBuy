-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "fulfilledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderItemId_key" ON "reviews"("orderItemId");

-- CreateIndex
CREATE INDEX "reviews_productId_idx" ON "reviews"("productId");

-- CreateIndex
CREATE INDEX "reviews_sellerId_idx" ON "reviews"("sellerId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

