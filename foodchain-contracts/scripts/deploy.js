const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

    // ── 1. Deploy UserRegistry ──────────────────────────────────
    console.log("\n[1/4] Deploying UserRegistry...");
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    const userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
    console.log("UserRegistry deployed to:", await userRegistry.getAddress());

    // ── 2. Deploy StoreRegistry ─────────────────────────────────
    console.log("\n[2/4] Deploying StoreRegistry...");
    const StoreRegistry = await ethers.getContractFactory("StoreRegistry");
    const storeRegistry = await StoreRegistry.deploy(await userRegistry.getAddress());
    await storeRegistry.waitForDeployment();
    console.log("StoreRegistry deployed to:", await storeRegistry.getAddress());

    // ── 3. Deploy DonationEscrow ────────────────────────────────
    console.log("\n[3/4] Deploying DonationEscrow...");
    // Gunakan alamat USDC di Polygon Amoy Testnet
    // Untuk testing lokal, deploy MockERC20 terlebih dahulu
    const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";

    const DonationEscrow = await ethers.getContractFactory("DonationEscrow");
    const donationEscrow = await DonationEscrow.deploy(
        await userRegistry.getAddress(),
        await storeRegistry.getAddress(),
        USDC_ADDRESS
    );
    await donationEscrow.waitForDeployment();
    console.log("DonationEscrow deployed to:", await donationEscrow.getAddress());

    // ── 4. Deploy DisputeResolution ─────────────────────────────
    console.log("\n[4/4] Deploying DisputeResolution...");
    const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
    const disputeResolution = await DisputeResolution.deploy(
        await userRegistry.getAddress(),
        await donationEscrow.getAddress()
    );
    await disputeResolution.waitForDeployment();
    console.log("DisputeResolution deployed to:", await disputeResolution.getAddress());

    // ── Post-deployment setup ───────────────────────────────────
    console.log("\n[Setup] Configuring contract relationships...");

    // Set DonationEscrow di StoreRegistry
    let tx = await storeRegistry.setEscrowContract(await donationEscrow.getAddress());
    await tx.wait();
    console.log("StoreRegistry: escrow contract set");

    // Set DisputeResolution di DonationEscrow
    tx = await donationEscrow.setDisputeContract(await disputeResolution.getAddress());
    await tx.wait();
    console.log("DonationEscrow: dispute contract set");

    // ── Summary ─────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════");
    console.log("DEPLOYMENT COMPLETE");
    console.log("═══════════════════════════════════════════════");
    console.log("UserRegistry:     ", await userRegistry.getAddress());
    console.log("StoreRegistry:    ", await storeRegistry.getAddress());
    console.log("DonationEscrow:   ", await donationEscrow.getAddress());
    console.log("DisputeResolution:", await disputeResolution.getAddress());
    console.log("Network:          ", (await ethers.provider.getNetwork()).name);
    console.log("═══════════════════════════════════════════════");
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});