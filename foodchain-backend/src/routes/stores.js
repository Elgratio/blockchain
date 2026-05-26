const express    = require('express');
const router     = express.Router();
const { v4: uuid } = require('uuid');
const db         = require('../utils/db');
const blockchain = require('../services/blockchainService');
const ipfs       = require('../services/ipfsService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// ── GET /api/stores/products — daftar produk tersedia ─────────
router.get('/products', async (req, res) => {
    const { storeAddress, page = 1, limit = 10 } = req.query;
    const filter = { isAvailable: true, ...(storeAddress ? { storeAddress } : {}) };
    const all    = await db.products.findAll(filter);
    const start  = (Number(page) - 1) * Number(limit);
    return res.json(ok('Daftar produk', {
        products:   all.slice(start, start + Number(limit)),
        pagination: { page: Number(page), limit: Number(limit), total: all.length },
    }));
});

// ── GET /api/stores/my-products — produk milik toko ini ───────
router.get('/my-products', authMiddleware, requireRole('STORE'), async (req, res) => {
    const products = await db.products.findAll({ storeAddress: req.user.walletAddress });
    return res.json(ok('Produk saya', { products, total: products.length }));
});

// ── POST /api/stores/products — daftarkan produk baru ─────────
router.post('/products', authMiddleware, requireRole('STORE'), async (req, res) => {
    try {
        const { name, price, expiryDate, stock, certificationNumber } = req.body;
        if (!name || !price || !expiryDate || !stock)
        return res.status(400).json(fail('name, price, expiryDate, stock diperlukan'));
        if (new Date(expiryDate) < new Date())
        return res.status(400).json(fail('Tanggal kedaluwarsa sudah lewat'));

        const storeAddress = req.user.walletAddress;
        const imageHash    = await ipfs.uploadJSON({ product: name, store: storeAddress }, 'img-' + name);
        const certHash     = await ipfs.uploadJSON({ cert: certificationNumber || 'N/A', store: storeAddress }, 'cert-' + name);
        const expiryTs     = Math.floor(new Date(expiryDate).getTime() / 1000);

        const { productId, txHash } = await blockchain.listProductOnChain(
        name, BigInt(price), imageHash, certHash, expiryTs, Number(stock)
        );

        const product = {
            id: uuid(), onChainId: productId, storeAddress, name,
            price: price.toString(), imageHash, certificationHash: certHash,
            expiryDate, isAvailable: true, stock: Number(stock),
            createdAt: new Date().toISOString(),
        };
        await db.products.insert(product);

        return res.status(201).json(ok('Produk berhasil didaftarkan on-chain', {
            product, txHash, imageUrl: ipfs.getIPFSUrl(imageHash),
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── GET /api/stores/reputation/:address — reputasi toko ───────
router.get('/reputation/:address', async (req, res) => {
    try {
        const rep = await blockchain.getStoreReputation(req.params.address);
        return res.json(ok('Reputasi toko', { storeAddress: req.params.address, reputation: rep }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

module.exports = router;