/*
  Warnings:

  - The values [STORE_CONFIRMED,IN_DELIVERY,DELIVERED] on the enum `DonationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [STORE] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DonationStatus_new" AS ENUM ('CREATED', 'COMPLETED', 'DISPUTED', 'REFUNDED');
ALTER TABLE "Donation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Donation" ALTER COLUMN "status" TYPE "DonationStatus_new" USING ("status"::text::"DonationStatus_new");
ALTER TYPE "DonationStatus" RENAME TO "DonationStatus_old";
ALTER TYPE "DonationStatus_new" RENAME TO "DonationStatus";
DROP TYPE "DonationStatus_old";
ALTER TABLE "Donation" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('DONOR', 'RECIPIENT', 'COURIER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;
