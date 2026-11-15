-- AlterTable
ALTER TABLE "products" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Existing products keep their single photo as the first gallery photo
UPDATE "products" SET "images" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL;
