-- Sellers get a public store name, the real name stays private (Yoy, 11-17).
-- Name changes were dropped, so their date column goes.
ALTER TABLE "users" DROP COLUMN "nameChangedAt",
ADD COLUMN "storeName" TEXT,
ADD COLUMN "storeNameChangedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_storeName_key" ON "users"("storeName");

-- Demo and evaluation stores keep their current name as the store name.
-- Real sellers are asked to pick one, so no real name becomes public.
UPDATE "users" SET "storeName" = "name"
WHERE "role" = 'SELLER'
  AND ("email" LIKE '%@demo.com' OR "email" LIKE 'vendor%.eval@propebuy.test');
