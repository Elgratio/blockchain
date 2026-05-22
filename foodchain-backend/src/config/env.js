require('dotenv').config();

const env = {
    PORT:        process.env.PORT        || '3000',
    NODE_ENV:    process.env.NODE_ENV    || 'development',
    JWT_SECRET:  process.env.JWT_SECRET  || 'foodchain-local-dev-secret-key-32ch',
    RPC_URL:     process.env.RPC_URL     || 'http://127.0.0.1:8545',
    PRIVATE_KEY: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',

    CONTRACT_USER_REGISTRY:      process.env.CONTRACT_USER_REGISTRY      || '',
    CONTRACT_STORE_REGISTRY:     process.env.CONTRACT_STORE_REGISTRY     || '',
    CONTRACT_DONATION_ESCROW:    process.env.CONTRACT_DONATION_ESCROW    || '',
    CONTRACT_DISPUTE_RESOLUTION: process.env.CONTRACT_DISPUTE_RESOLUTION || '',

    PINATA_API_KEY:    process.env.PINATA_API_KEY    || '',
    PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY || '',

    // true  → gunakan mock (tidak perlu Hardhat/blockchain berjalan)
    // false → sambungkan ke blockchain nyata via RPC_URL
    USE_MOCK_BLOCKCHAIN: process.env.USE_MOCK_BLOCKCHAIN === 'true',
    USE_MOCK_IPFS:       process.env.USE_MOCK_IPFS       === 'true',
};

module.exports = env;