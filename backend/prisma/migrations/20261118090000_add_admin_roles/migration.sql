-- Admin roles (Yoy, 11-18): staff level on admin accounts plus an audit log

-- Staff levels inside the ADMIN role
CREATE TYPE "AdminLevel" AS ENUM ('SUPER_ADMIN', 'MODERATOR', 'BARANGAY_VERIFIER');

ALTER TABLE "users" ADD COLUMN "adminLevel" "AdminLevel";

-- Every existing admin is a founder account, so it keeps full access
UPDATE "users" SET "adminLevel" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';

-- Audit log
CREATE TABLE "admin_logs" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");
CREATE INDEX "admin_logs_adminId_idx" ON "admin_logs"("adminId");

ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
