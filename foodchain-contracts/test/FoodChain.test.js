const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("FoodChain Smart Contracts", function () {
    let userRegistry, storeRegistry, donationEscrow, disputeResolution, mockUSDC;
    let owner, donor, store, recipient, courier, attacker;

    beforeEach(async function () {
        [owner, donor, store, recipient, courier, attacker] = await ethers.getSigners();

        // Deploy MockERC20 (USDC simulasi)
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
        await mockUSDC.waitForDeployment();

        // Deploy semua kontrak
        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy();

        const StoreRegistry = await ethers.getContractFactory("StoreRegistry");
        storeRegistry = await StoreRegistry.deploy(await userRegistry.getAddress());

        const DonationEscrow = await ethers.getContractFactory("DonationEscrow");
        donationEscrow = await DonationEscrow.deploy(
        await userRegistry.getAddress(),
        await storeRegistry.getAddress(),
        await mockUSDC.getAddress()
        );

        const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
        disputeResolution = await DisputeResolution.deploy(
        await userRegistry.getAddress(),
        await donationEscrow.getAddress()
        );

        // Setup relasi kontrak
        await storeRegistry.setEscrowContract(await donationEscrow.getAddress());
        await donationEscrow.setDisputeContract(await disputeResolution.getAddress());

        // Mint USDC ke donor untuk testing
        await mockUSDC.mint(donor.address, ethers.parseUnits("1000", 6));
    });

    // ─── HELPER: Register & Verify all actors ────────────────────
    async function setupActors() {
        await userRegistry.connect(donor).registerUser(0, "ipfs://donor-hash");
        await userRegistry.connect(store).registerUser(1, "ipfs://store-hash");
        await userRegistry.connect(recipient).registerUser(2, "ipfs://recipient-hash");
        await userRegistry.connect(courier).registerUser(3, "ipfs://courier-hash");

        await userRegistry.connect(owner).verifyUser(donor.address);
        await userRegistry.connect(owner).verifyUser(store.address);
        await userRegistry.connect(owner).verifyUser(recipient.address);
        await userRegistry.connect(owner).verifyUser(courier.address);

        await storeRegistry.connect(owner).initStoreReputation(store.address);
    }

    // ─── HELPER: List a product ───────────────────────────────────
    async function listProduct() {
        const expiry = Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // 30 hari lagi
        const tx = await storeRegistry.connect(store).listProduct(
        "Beras Premium 5kg",
        ethers.parseUnits("75000", 6),
        "ipfs://beras-photo",
        "ipfs://bpom-cert",
        expiry,
        100
        );
        const receipt = await tx.wait();
        return 1; // productId pertama
    }

    // ─────────────────────────────────────────────────────────────

    describe("UserRegistry", function () {
        it("should register a donor successfully", async function () {
        await userRegistry.connect(donor).registerUser(0, "ipfs://donor-hash");
        expect(await userRegistry.isRegistered(donor.address)).to.equal(true);
        expect(await userRegistry.isVerified(donor.address)).to.equal(false);
        });

        it("should verify a user (admin only)", async function () {
        await userRegistry.connect(donor).registerUser(0, "ipfs://donor-hash");
        await userRegistry.connect(owner).verifyUser(donor.address);
        expect(await userRegistry.isVerified(donor.address)).to.equal(true);
        });

        it("should NOT allow self-registration as admin", async function () {
        await expect(
            userRegistry.connect(donor).registerUser(4, "ipfs://hash") // Role.ADMIN = 4
        ).to.be.revertedWith("UserRegistry: cannot self-register as admin");
        });

        it("should NOT allow double registration", async function () {
        await userRegistry.connect(donor).registerUser(0, "ipfs://hash");
        await expect(
            userRegistry.connect(donor).registerUser(0, "ipfs://hash2")
        ).to.be.revertedWith("UserRegistry: already registered");
        });

        it("should suspend and reactivate a user", async function () {
        await userRegistry.connect(store).registerUser(1, "ipfs://hash");
        await userRegistry.connect(owner).verifyUser(store.address);
        await userRegistry.connect(owner).suspendUser(store.address);
        expect(await userRegistry.isVerified(store.address)).to.equal(false);
        await userRegistry.connect(owner).reactivateUser(store.address);
        expect(await userRegistry.isVerified(store.address)).to.equal(true);
        });
    });

    describe("StoreRegistry", function () {
        beforeEach(setupActors);

        it("should list a product successfully", async function () {
        const productId = await listProduct();
        const product = await storeRegistry.getProduct(productId);
        expect(product.name).to.equal("Beras Premium 5kg");
        expect(product.isAvailable).to.equal(true);
        });

        it("should NOT list an expired product", async function () {
        const pastExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 jam lalu
        await expect(
            storeRegistry.connect(store).listProduct(
            "Produk Expired",
            ethers.parseUnits("10000", 6),
            "ipfs://img", "ipfs://cert",
            pastExpiry, 10
            )
        ).to.be.revertedWith("StoreRegistry: product already expired");
        });
    });

    describe("DonationEscrow Path", function () {
        let productId, donationId, amount;

        beforeEach(async function () {
        await setupActors();
        productId = await listProduct();
        amount = ethers.parseUnits("75", 6);

        // Approve escrow untuk mengambil USDC dari donor
        await mockUSDC.connect(donor).approve(await donationEscrow.getAddress(), amount);
        });

        it("should execute the complete path", async function () {
        // Step 1: Create donation
        const tx = await donationEscrow.connect(donor).createDonation(
            store.address, recipient.address, courier.address,
            [productId], amount
        );
        const receipt = await tx.wait();
        donationId = 1;

        let d = await donationEscrow.getDonation(donationId);
        expect(d.status).to.equal(0); // CREATED

        // Step 2: Store confirms
        await donationEscrow.connect(store).storeConfirm(donationId, "ipfs://packing-photo");
        d = await donationEscrow.getDonation(donationId);
        expect(d.status).to.equal(1); // STORE_CONFIRMED

        // Step 3: Courier picks up
        await donationEscrow.connect(courier).courierPickup(donationId, "ipfs://pickup-photo");
        d = await donationEscrow.getDonation(donationId);
        expect(d.status).to.equal(2); // IN_DELIVERY

        // Step 4: Recipient confirms with rating 5
        const storeBalanceBefore = await mockUSDC.balanceOf(store.address);
        await donationEscrow.connect(recipient).recipientConfirm(
            donationId, "ipfs://received-photo", 5
        );
        d = await donationEscrow.getDonation(donationId);
        expect(d.status).to.equal(4); // COMPLETED

        // Verifikasi dana cair ke toko (dikurangi platform fee 1%)
        const storeBalanceAfter = await mockUSDC.balanceOf(store.address);
        const expectedPayout = amount - (amount * 100n / 10000n);
        expect(storeBalanceAfter - storeBalanceBefore).to.equal(expectedPayout);
        });

        it("should handle dispute and refund donor", async function () {
        await mockUSDC.connect(donor).approve(await donationEscrow.getAddress(), amount);
        await donationEscrow.connect(donor).createDonation(
            store.address, recipient.address, courier.address, [productId], amount
        );
        donationId = 1;

        await donationEscrow.connect(store).storeConfirm(donationId, "ipfs://packing");
        await donationEscrow.connect(courier).courierPickup(donationId, "ipfs://pickup");

        // Rating 1 → masuk dispute
        await donationEscrow.connect(recipient).recipientConfirm(
            donationId, "ipfs://received", 1
        );
        let d = await donationEscrow.getDonation(donationId);
        expect(d.status).to.equal(5); // DISPUTED

        // Penerima ajukan dispute
        await disputeResolution.connect(recipient).raiseDispute(donationId, "ipfs://evidence");

        // Admin putuskan: donor menang
        const donorBalanceBefore = await mockUSDC.balanceOf(donor.address);
        await disputeResolution.connect(owner).resolveDispute(
            donationId, 2, "ipfs://resolution-notes" // DONOR_WIN = 2
        );

        d = await donationEscrow.getDonation(donationId);
        expect(d.status).to.equal(6); // REFUNDED

        const donorBalanceAfter = await mockUSDC.balanceOf(donor.address);
        expect(donorBalanceAfter - donorBalanceBefore).to.equal(amount);
        });
    });
});