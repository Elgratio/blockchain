/*
  Warnings:

  - The `result` column on the `Dispute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fcmToken` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DisputeResult" AS ENUM ('PENDING', 'STORE_WIN', 'DONOR_WIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DonationStatus" ADD VALUE 'STORE_CONFIRMED';
ALTER TYPE "DonationStatus" ADD VALUE 'IN_DELIVERY';
ALTER TYPE "DonationStatus" ADD VALUE 'DELIVERED';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STORE';

-- AlterTable
ALTER TABLE "Dispute" DROP COLUMN "result",
ADD COLUMN     "result" "DisputeResult" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Donation" ALTER COLUMN "totalAmount" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "DonationProduct" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE TEXT,
ALTER COLUMN "imageHash" SET DEFAULT '',
ALTER COLUMN "certificationHash" SET DEFAULT '',
ALTER COLUMN "expiryDate" SET DATA TYPE TEXT,
ALTER COLUMN "stock" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "fcmToken",
ALTER COLUMN "dataHash" SET DEFAULT '';
