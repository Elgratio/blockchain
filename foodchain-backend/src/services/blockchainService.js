const env    = require('../config/env');
const logger = require('../utils/logger');

function makeTx() {
    return '0xMOCK_' + Math.random().toString(16).slice(2, 18).padEnd(16, '0');
}

// ── MOCK SERVICE (plain object) ───────────────────────────────────────────
const mockService = {
    _donationCounter: 0,
    _productCounter:  0,
    _verifiedUsers:   new Set(),

    async registerUserOnChain(addr, role, hash) {
        const tx = makeTx();
        logger.info('[CHAIN] registerUser addr=' + addr.slice(0,10) + ' role=' + role + ' tx=' + tx);
        return tx;
    },
    async verifyUserOnChain(addr) {
        this._verifiedUsers.add(addr);
        const tx = makeTx();
        logger.info('[CHAIN] verifyUser addr=' + addr.slice(0,10) + ' tx=' + tx);
        return tx;
    },
    async isVerified(addr) {
        return this._verifiedUsers.has(addr);
    },
    async listProductOnChain(name, price, imgHash, certHash, expiry, stock) {
        this._productCounter++;
        const tx = makeTx();
        logger.info('[CHAIN] listProduct name=' + name + ' id=' + this._productCounter + ' tx=' + tx);
        return { productId: this._productCounter, txHash: tx };
    },
    async getStoreReputation(addr) {
        return { reputationScore:100, totalOrders:0, successfulOrders:0,
                totalDisputes:0, disputesLost:0, isSuspended:false };
    },
    async createDonationOnChain(store, recipient, courier, productIds, amount) {
        this._donationCounter++;
        const tx = makeTx();
        logger.info('[CHAIN] createDonation id=' + this._donationCounter +
                    ' amount=' + amount.toString() + ' tx=' + tx);
        return { donationId: this._donationCounter, txHash: tx };
    },
    async storeConfirmOnChain(id, hash) {
        const tx = makeTx();
        logger.info('[CHAIN] storeConfirm donationId=' + id + ' tx=' + tx);
        return tx;
    },
    async courierPickupOnChain(id, hash) {
        const tx = makeTx();
        logger.info('[CHAIN] courierPickup donationId=' + id + ' tx=' + tx);
        return tx;
    },
    async recipientConfirmOnChain(id, hash, rating) {
        const tx = makeTx();
        logger.info('[CHAIN] recipientConfirm donationId=' + id + ' rating=' + rating + ' tx=' + tx);
        return tx;
    },
    async getDonationFromChain(id) {
        return { donationId: id, status: 'MOCK', note: 'mock blockchain mode' };
    },
    async raiseDisputeOnChain(id, hash) {
        const tx = makeTx();
        logger.info('[CHAIN] raiseDispute donationId=' + id + ' tx=' + tx);
        return tx;
    },
    async resolveDisputeOnChain(id, result, notes) {
        const tx = makeTx();
        logger.info('[CHAIN] resolveDispute donationId=' + id + ' result=' + result + ' tx=' + tx);
        return tx;
    },
};

// ── Auto-detect ───────────────────────────────────────────────────────────
let service;
const useMock = env.USE_MOCK_BLOCKCHAIN || !env.CONTRACT_DONATION_ESCROW;

if (useMock) {
    logger.warn('BlockchainService: MOCK mode aktif');
    service = mockService;
    } else {
        try { service = makeRealService(); }
        catch (e) {
            logger.warn('Real blockchain gagal (' + e.message + ') → fallback ke MOCK');
            service = mockService;
        }
    }

// Verifikasi semua method ada sebelum export
const required = ['registerUserOnChain','verifyUserOnChain','isVerified',
    'listProductOnChain','getStoreReputation','createDonationOnChain',
    'storeConfirmOnChain','courierPickupOnChain','recipientConfirmOnChain',
    'getDonationFromChain','raiseDisputeOnChain','resolveDisputeOnChain'];
for (const m of required) {
    if (typeof service[m] !== 'function') logger.error('MISSING METHOD: ' + m);
}

module.exports = service;