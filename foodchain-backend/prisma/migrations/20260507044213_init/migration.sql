-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DONOR', 'STORE', 'RECIPIENT', 'COURIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('CREATED', 'STORE_CONFIRMED', 'IN_DELIVERY', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "dataHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fcmToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "onChainId" INTEGER,
    "storeAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "certificationHash" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "onChainId" INTEGER,
    "donorAddress" TEXT NOT NULL,
    "storeAddress" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "courierAddress" TEXT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'CREATED',
    "packingPhotoHash" TEXT,
    "pickupPhotoHash" TEXT,
    "receivedPhotoHash" TEXT,
    "recipientRating" INTEGER,
    "txHashCreate" TEXT,
    "txHashComplete" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationProduct" (
    "donationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "DonationProduct_pkey" PRIMARY KEY ("donationId","productId")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "storeResponseHash" TEXT,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Product_onChainId_key" ON "Product"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_onChainId_key" ON "Donation"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_donationId_key" ON "Dispute"("donationId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeAddress_fkey" FOREIGN KEY ("storeAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorAddress_fkey" FOREIGN KEY ("donorAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_storeAddress_fkey" FOREIGN KEY ("storeAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_recipientAddress_fkey" FOREIGN KEY ("recipientAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_courierAddress_fkey" FOREIGN KEY ("courierAddress") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationProduct" ADD CONSTRAINT "DonationProduct_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationProduct" ADD CONSTRAINT "DonationProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
