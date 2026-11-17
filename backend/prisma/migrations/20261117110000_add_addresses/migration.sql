-- Saved delivery addresses, several per buyer (E2E #423)
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every buyer's current address becomes their first, default address
INSERT INTO "addresses" ("userId", "label", "address", "isDefault")
SELECT "id", 'Home', "address", true FROM "users"
WHERE "role" = 'BUYER' AND "address" IS NOT NULL AND btrim("address") <> '';
