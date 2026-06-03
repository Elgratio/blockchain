const env    = require('../config/env');
const logger = require('../utils/logger');

// ════════════════════════════════════════════════════════════════
// MOCK MODE — tidak perlu node blockchain berjalan
// Digunakan saat USE_MOCK_BLOCKCHAIN=true atau kontrak belum di-deploy
// ════════════════════════════════════════════════════════════════
class MockBlockchainService {
  constructor() {
    this._donationCounter = 0;
    this._productCounter  = 0;
    this._verifiedUsers   = new Set();
    logger.warn('BlockchainService: MOCK mode aktif (tidak ada transaksi nyata)');
  }

  _tx() {
    return '0xMOCK_' + Math.random().toString(16).slice(2, 18).padEnd(16, '0');
  }

  async registerUserOnChain(addr, role, hash) {
    const tx = this._tx();
    logger.info('[CHAIN] registerUser addr=' + addr.slice(0,10) + ' role=' + role + ' tx=' + tx);
    return tx;
  }
  async verifyUserOnChain(addr) {
    this._verifiedUsers.add(addr);
    const tx = this._tx();
    logger.info('[CHAIN] verifyUser addr=' + addr.slice(0,10) + ' tx=' + tx);
    return tx;
  }
  async isVerified(addr) { return this._verifiedUsers.has(addr); }

  async listProductOnChain(name, price, imgHash, certHash, expiry, stock) {
    this._productCounter++;
    const tx = this._tx();
    logger.info('[CHAIN] listProduct name=' + name + ' id=' + this._productCounter + ' tx=' + tx);
    return { productId: this._productCounter, txHash: tx };
  }
  async getStoreReputation(addr) {
    return {
      reputationScore: 100, totalOrders: 0, successfulOrders: 0,
      totalDisputes: 0, disputesLost: 0, isSuspended: false
    };
  }

  async createDonationOnChain(store, recipient, courier, productIds, amount) {
    this._donationCounter++;
    const tx = this._tx();
    logger.info('[CHAIN] createDonation id=' + this._donationCounter + ' amount=' + amount.toString() + ' tx=' + tx);
    return { donationId: this._donationCounter, txHash: tx };
  }
  async storeConfirmOnChain(id, hash) {
    const tx = this._tx();
    logger.info('[CHAIN] storeConfirm donationId=' + id + ' tx=' + tx);
    return tx;
  }
  async courierPickupOnChain(id, hash) {
    const tx = this._tx();
    logger.info('[CHAIN] courierPickup donationId=' + id + ' tx=' + tx);
    return tx;
  }
  async recipientConfirmOnChain(id, hash, rating) {
    const tx = this._tx();
    logger.info('[CHAIN] recipientConfirm donationId=' + id + ' rating=' + rating + ' tx=' + tx);
    return tx;
  }
  async getDonationFromChain(id) {
    return { donationId: id, status: 'MOCK', note: 'mock blockchain mode' };
  }
  async raiseDisputeOnChain(id, hash) {
    const tx = this._tx();
    logger.info('[CHAIN] raiseDispute donationId=' + id + ' tx=' + tx);
    return tx;
  }
  async resolveDisputeOnChain(id, result, notes) {
    const tx = this._tx();
    logger.info('[CHAIN] resolveDispute donationId=' + id + ' result=' + result + ' tx=' + tx);
    return tx;
  }
}

// ════════════════════════════════════════════════════════════════
// REAL MODE — ethers.js + smart contract Polygon/Hardhat
// Digunakan saat USE_MOCK_BLOCKCHAIN=false dan kontrak sudah di-deploy
// ════════════════════════════════════════════════════════════════
class RealBlockchainService {
  constructor() {
    const { ethers } = require('ethers');
    const contracts  = require('../config/contracts');

    this.provider = new ethers.JsonRpcProvider(env.RPC_URL);
    this.signer   = new ethers.Wallet(env.PRIVATE_KEY, this.provider);
    this.userReg  = new ethers.Contract(contracts.addresses.userRegistry,      contracts.abis.userRegistry,      this.signer);
    this.storeReg = new ethers.Contract(contracts.addresses.storeRegistry,     contracts.abis.storeRegistry,     this.signer);
    this.escrow   = new ethers.Contract(contracts.addresses.donationEscrow,    contracts.abis.donationEscrow,    this.signer);
    this.dispute  = new ethers.Contract(contracts.addresses.disputeResolution, contracts.abis.disputeResolution, this.signer);

    this._listenEvents();
    logger.info('BlockchainService: REAL mode → ' + env.RPC_URL);
  }

  _parseEvent(receipt, contract, eventName) {
    const log = receipt.logs
      .map(l => { try { return contract.interface.parseLog(l); } catch (e) { return null; } })
      .find(e => e && e.name === eventName);
    return log ? log.args : null;
  }

  async registerUserOnChain(addr, role, hash) {
    const roleMap = { DONOR: 0, STORE: 1, RECIPIENT: 2, COURIER: 3 };
    const tx = await this.userReg.registerUser(roleMap[role], hash);
    const r  = await tx.wait();
    logger.info('[CHAIN] registerUser tx=' + r.hash);
    return r.hash;
  }
  async verifyUserOnChain(addr) {
    const tx = await this.userReg.verifyUser(addr);
    const r  = await tx.wait();
    logger.info('[CHAIN] verifyUser tx=' + r.hash);
    return r.hash;
  }
  async isVerified(addr)        { return await this.userReg.isVerified(addr); }

  async listProductOnChain(name, price, imgHash, certHash, expiry, stock) {
    const tx = await this.storeReg.listProduct(name, price, imgHash, certHash, expiry, stock);
    const r  = await tx.wait();
    const ev = this._parseEvent(r, this.storeReg, 'ProductListed');
    return { productId: ev ? Number(ev.productId) : null, txHash: r.hash };
  }
  async getStoreReputation(addr) {
    const rep = await this.storeReg.getStoreReputation(addr);
    return {
      reputationScore:  Number(rep[0]), totalOrders:      Number(rep[1]),
      successfulOrders: Number(rep[2]), totalDisputes:    Number(rep[3]),
      disputesLost:     Number(rep[4]), isSuspended:      rep[5],
    };
  }

  async createDonationOnChain(store, recipient, courier, productIds, amount) {
    const tx = await this.escrow.createDonation(store, recipient, courier, productIds, amount);
    const r  = await tx.wait();
    const ev = this._parseEvent(r, this.escrow, 'DonationCreated');
    return { donationId: ev ? Number(ev.donationId) : null, txHash: r.hash };
  }
  async storeConfirmOnChain(id, hash) {
    const tx = await this.escrow.storeConfirm(id, hash); const r = await tx.wait(); return r.hash;
  }
  async courierPickupOnChain(id, hash) {
    const tx = await this.escrow.courierPickup(id, hash); const r = await tx.wait(); return r.hash;
  }
  async recipientConfirmOnChain(id, hash, rating) {
    const tx = await this.escrow.recipientConfirm(id, hash, rating); const r = await tx.wait(); return r.hash;
  }
  async getDonationFromChain(id) {
    const d = await this.escrow.getDonation(id);
    const statusMap = ['CREATED','STORE_CONFIRMED','IN_DELIVERY','DELIVERED','COMPLETED','DISPUTED','REFUNDED'];
    return {
      donationId: Number(d[0]), donor: d[1], store: d[2], recipient: d[3], courier: d[4],
      productIds: d[5].map(Number), totalAmount: d[6].toString(), status: statusMap[Number(d[7])],
      packingPhotoHash: d[10], pickupPhotoHash: d[11], receivedPhotoHash: d[12], recipientRating: Number(d[13]),
    };
  }
  async raiseDisputeOnChain(id, hash) {
    const tx = await this.dispute.raiseDispute(id, hash); const r = await tx.wait(); return r.hash;
  }
  async resolveDisputeOnChain(id, result, notes) {
    const rMap = { STORE_WIN: 1, DONOR_WIN: 2 };
    const tx = await this.dispute.resolveDispute(id, rMap[result], notes);
    const r  = await tx.wait(); return r.hash;
  }
  _listenEvents() {
    this.escrow.on('DonationCompleted', (id, store, amount) =>
      logger.info('[EVENT] DonationCompleted id=' + id + ' store=' + store));
    this.escrow.on('DonationDisputed', (id, by) =>
      logger.warn('[EVENT] DonationDisputed id=' + id + ' by=' + by));
  }
}

// ── Auto-detect: mock jika kontrak belum di-set, real jika sudah ─────────
let instance;
if (env.USE_MOCK_BLOCKCHAIN || !env.CONTRACT_DONATION_ESCROW) {
  instance = new MockBlockchainService();
} else {
  try {
    instance = new RealBlockchainService();
  } catch (e) {
    logger.warn('Real blockchain gagal: ' + e.message + ' → fallback ke MOCK');
    instance = new MockBlockchainService();
  }
}

module.exports = instance;