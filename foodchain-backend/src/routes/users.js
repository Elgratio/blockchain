const express    = require('express');
const router     = express.Router();
const { v4: uuid } = require('uuid');
const db         = require('../utils/db');
const blockchain = require('../services/blockchainService');
const ipfs       = require('../services/ipfsService');
const { verifyWalletSignature, generateToken, authMiddleware, requireRole } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// ── POST /api/users/register ──────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, role, name, email, phone } = req.body;

        if (!walletAddress || !role || !name)
        return res.status(400).json(fail('walletAddress, role, name diperlukan'));

        // tambahkan 'ADMIN' ke validRoles
        const validRoles = ['ADMIN', 'DONOR', 'STORE', 'RECIPIENT', 'COURIER'];
        if (!validRoles.includes(role))
        return res.status(400).json(fail('Role tidak valid. Pilih: ' + validRoles.join(', ')));

        if (await db.users.findByWallet(walletAddress))
        return res.status(409).json(fail('Wallet address sudah terdaftar'));

        const dataHash = await ipfs.uploadJSON(
        { name, email, phone, role }, 'user-' + walletAddress.slice(0, 10)
        );

        // ADMIN tidak perlu dicatat on-chain (tidak ada role admin di smart contract)
        let txHash = 'N/A (admin tidak dicatat on-chain)';
        if (role !== 'ADMIN') {
        txHash = await blockchain.registerUserOnChain(walletAddress, role, dataHash);
        }

        // ADMIN langsung terverifikasi tanpa perlu approval
        const isVerified = role === 'ADMIN';

        const user = {
        id: uuid(), walletAddress, role, name,
        email: email || null, phone: phone || null,
        dataHash, isVerified, isActive: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        await db.users.insert(user);

        const msg = role === 'ADMIN'
        ? 'Admin berhasil terdaftar dan langsung terverifikasi.'
        : 'Registrasi berhasil. Menunggu verifikasi admin.';

        return res.status(201).json(ok(msg, { user, txHash, ipfsUrl: ipfs.getIPFSUrl(dataHash) }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/users/login — dengan wallet signature ───────────
router.post('/login', async (req, res) => {
    try {
        const { walletAddress, signature, message } = req.body;
        if (!walletAddress || !signature || !message)
        return res.status(400).json(fail('walletAddress, signature, message diperlukan'));

        if (!verifyWalletSignature(message, signature, walletAddress))
        return res.status(401).json(fail('Signature wallet tidak valid'));

        const user = await db.users.findByWallet(walletAddress);
        if (!user)      return res.status(404).json(fail('Pengguna belum terdaftar'));
        if (!user.isActive) return res.status(401).json(fail('Akun tidak aktif'));

        const token = generateToken(walletAddress, user.role);
        return res.json(ok('Login berhasil', { token, user }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/users/login-dev — tanpa signature (hanya development) ──
router.post('/login-dev', async (req, res) => {
    if (process.env.NODE_ENV === 'production')
        return res.status(403).json(fail('Endpoint ini hanya tersedia di development'));
    const { walletAddress } = req.body;
    const user = await db.users.findByWallet(walletAddress);
    if (!user) return res.status(404).json(fail('User tidak ditemukan. Register dulu.'));
    const token = generateToken(walletAddress, user.role);
    return res.json(ok('Login dev berhasil', { token, user }));
});

// ── GET /api/users/me ─────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const isVerifiedOnChain = req.user.role === 'ADMIN'
        ? true
        : await blockchain.isVerified(req.user.walletAddress);
        return res.json(ok('Data pengguna', { ...req.user, isVerifiedOnChain }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── GET /api/users/all — semua pengguna (admin only) ──────────
router.get('/all', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    const users = await db.users.findAll();
    return res.json(ok('Semua pengguna', { users, total: users.length }));
});

// POST /api/users/verify/:address — ADMIN tidak perlu verify on-chain
router.post('/verify/:address', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    try {
        const { address } = req.params;
        const user = await db.users.findByWallet(address);
        if (!user) return res.status(404).json(fail('User tidak ditemukan'));
        if (user.isVerified) return res.status(400).json(fail('User sudah diverifikasi'));

        // FIXED: skip blockchain untuk admin
        let txHash = 'N/A';
        if (user.role !== 'ADMIN') {
        txHash = await blockchain.verifyUserOnChain(address);
        }
        await db.users.update(address, { isVerified: true });
        return res.json(ok('Pengguna berhasil diverifikasi', { address, txHash }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

module.exports = router;