const env = require('./env');

const USER_REGISTRY_ABI = [
    "function registerUser(uint8 role, string dataHash) external",
    "function verifyUser(address user) external",
    "function isVerified(address user) external view returns (bool)",
    "function getRole(address user) external view returns (uint8)",
    "event UserRegistered(address indexed user, uint8 role, uint256 timestamp)",
    "event UserVerified(address indexed user, address indexed verifiedBy)",
];

const STORE_REGISTRY_ABI = [
    "function listProduct(string name, uint256 price, string imageHash, string certHash, uint256 expiryDate, uint256 stock) external returns (uint256)",
    "function isProductAvailable(uint256 productId) external view returns (bool)",
    "function getStoreReputation(address store) external view returns (tuple(uint256,uint256,uint256,uint256,uint256,bool))",
    "event ProductListed(uint256 indexed productId, address indexed store, string name, uint256 price)",
];

const DONATION_ESCROW_ABI = [
    "function createDonation(address store, address recipient, address courier, uint256[] productIds, uint256 amount) external returns (uint256)",
    "function storeConfirm(uint256 donationId, string packingPhotoHash) external",
    "function courierPickup(uint256 donationId, string pickupPhotoHash) external",
    "function recipientConfirm(uint256 donationId, string receivedPhotoHash, uint8 rating) external",
    "function getDonation(uint256 donationId) external view returns (tuple(uint256,address,address,address,address,uint256[],uint256,uint8,uint256,uint256,string,string,string,uint8))",
    "event DonationCreated(uint256 indexed donationId, address indexed donor, address indexed recipient, address store, uint256 amount)",
    "event DonationCompleted(uint256 indexed donationId, address store, uint256 amount)",
    "event DonationDisputed(uint256 indexed donationId, address raisedBy)",
];

const DISPUTE_RESOLUTION_ABI = [
    "function raiseDispute(uint256 donationId, string evidenceHash) external",
    "function resolveDispute(uint256 donationId, uint8 result, string resolutionNotes) external",
    "event DisputeResolved(uint256 indexed donationId, uint8 result, address resolvedBy)",
];

module.exports = {
    addresses: {
        userRegistry:      env.CONTRACT_USER_REGISTRY,
        storeRegistry:     env.CONTRACT_STORE_REGISTRY,
        donationEscrow:    env.CONTRACT_DONATION_ESCROW,
        disputeResolution: env.CONTRACT_DISPUTE_RESOLUTION,
    },
    abis: {
        userRegistry:      USER_REGISTRY_ABI,
        storeRegistry:     STORE_REGISTRY_ABI,
        donationEscrow:    DONATION_ESCROW_ABI,
        disputeResolution: DISPUTE_RESOLUTION_ABI,
    },
};