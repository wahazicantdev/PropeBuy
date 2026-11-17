-- Profile photo and the last change date of photo, name and email (7-day wait)
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "avatarChangedAt" TIMESTAMP(3),
ADD COLUMN "nameChangedAt" TIMESTAMP(3),
ADD COLUMN "emailChangedAt" TIMESTAMP(3);
