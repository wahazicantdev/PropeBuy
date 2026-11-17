-- Seller answers a buyer review (E2E #419)
ALTER TABLE "reviews" ADD COLUMN "sellerReply" TEXT,
ADD COLUMN "repliedAt" TIMESTAMP(3);
