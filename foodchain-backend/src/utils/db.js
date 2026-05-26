// src/utils/db.js
require('dotenv').config();
const logger  = require('./logger');
const useJSON = process.env.USE_JSON_DB !== 'false'; // default: JSON


// PostgreSQL via Prisma (Produksi)

function makePrismaDB() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ log: ['warn', 'error'] });

  logger.info('Database: PostgreSQL + Prisma mode');

  return {
    users: {
      insert: async u => prisma.user.create({
        data: {
          id: u.id, walletAddress: u.walletAddress, role: u.role,
          name: u.name, email: u.email, phone: u.phone,
          dataHash: u.dataHash || '', isVerified: u.isVerified || false,
          isActive: u.isActive !== false,
        }
      }),
      findByWallet: async w  => prisma.user.findUnique({ where: { walletAddress: w } }),
      findAll:      async () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
      update: async (w, f) => {
        const data = {};
        if (f.isVerified !== undefined) data.isVerified = f.isVerified;
        if (f.isActive   !== undefined) data.isActive   = f.isActive;
        if (f.name)  data.name  = f.name;
        if (f.email) data.email = f.email;
        if (f.phone) data.phone = f.phone;
        return prisma.user.update({ where: { walletAddress: w }, data });
      },
    },

    products: {
      insert: async p => prisma.product.create({
        data: {
          id: p.id, onChainId: p.onChainId, storeAddress: p.storeAddress,
          name: p.name, price: p.price.toString(),
          imageHash: p.imageHash || '', certificationHash: p.certificationHash || '',
          expiryDate: p.expiryDate, isAvailable: p.isAvailable !== false,
          stock: p.stock || 0,
        }
      }),
      findById:        async id  => prisma.product.findUnique({ where: { id } }),
      findByOnChainId: async oid => prisma.product.findUnique({ where: { onChainId: oid } }),
      findAll: async (f = {}) => {
        const where = {};
        if (f.storeAddress)            where.storeAddress = f.storeAddress;
        if (f.isAvailable !== undefined) where.isAvailable = f.isAvailable;
        return prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
      },
      update: async (id, f) => {
        const data = {};
        if (f.isAvailable !== undefined) data.isAvailable = f.isAvailable;
        if (f.stock       !== undefined) data.stock       = f.stock;
        return prisma.product.update({ where: { id }, data });
      },
    },

    donations: {
      insert: async d => prisma.donation.create({
        data: {
          id: d.id, onChainId: d.onChainId,
          donorAddress: d.donorAddress, storeAddress: d.storeAddress,
          recipientAddress: d.recipientAddress, courierAddress: d.courierAddress,
          totalAmount: d.totalAmount.toString(), status: d.status || 'CREATED',
          txHashCreate: d.txHashCreate,
        }
      }),
      findById: async id => prisma.donation.findUnique({ where: { id }, include: { dispute: true } }),
      findAll: async (f = {}) => {
        const where = {};
        if (f.donorAddress)     where.donorAddress     = f.donorAddress;
        if (f.storeAddress)     where.storeAddress     = f.storeAddress;
        if (f.recipientAddress) where.recipientAddress = f.recipientAddress;
        if (f.courierAddress)   where.courierAddress   = f.courierAddress;
        if (f.status)           where.status           = f.status;
        return prisma.donation.findMany({ where, orderBy: { createdAt: 'desc' } });
      },
      update: async (id, f) => {
        const data = {};
        const keys = ['status','packingPhotoHash','pickupPhotoHash','receivedPhotoHash',
                      'recipientRating','txHashCreate','txHashComplete'];
        for (const k of keys) if (f[k] !== undefined) data[k] = f[k];
        return prisma.donation.update({ where: { id }, data });
      },
    },

    disputes: {
      insert: async d => prisma.dispute.create({
        data: {
          id: d.id, donationId: d.donationId, raisedBy: d.raisedBy,
          evidenceHash: d.evidenceHash, result: d.result || 'PENDING',
        }
      }),
      findByDonation: async did => prisma.dispute.findUnique({ where: { donationId: did } }),
      update: async (did, f) => {
        const data = {};
        const keys = ['storeResponseHash','result','resolvedBy','resolutionNotes','resolvedAt'];
        for (const k of keys) if (f[k] !== undefined) data[k] = f[k];
        return prisma.dispute.update({ where: { donationId: did }, data });
      },
    },

    _prisma: prisma, // expose untuk query kompleks
  };
}

module.exports = makePrismaDB();