const express    = require('express');
const router     = express.Router();
const { v4: uuid } = require('uuid');
const db         = require('../utils/db');
const blockchain = require('../services/blockchainService');
const ipfs       = require('../services/ipfsService');
const notify     = require('../services/notificationService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// ── POST /api/donations — buat donasi baru ────────────────────
router.post('/', authMiddleware, requireRole('DONOR'), async (req, res) => {
    try {
        const { storeAddress, recipientAddress, courierAddress, productIds, amount } = req.body;
        if (!storeAddress || !recipientAddress || !courierAddress || !productIds?.length || !amount)
        return res.status(400).json(fail('storeAddress, recipientAddress, courierAddress, productIds, amount diperlukan'));

        const store     = await db.users.findByWallet(storeAddress);
        const recipient = await db.users.findByWallet(recipientAddress);
        const courier   = await db.users.findByWallet(courierAddress);

        if (!store     || store.role     !== 'STORE')     return res.status(400).json(fail('Toko tidak valid'));
        if (!recipient || recipient.role !== 'RECIPIENT') return res.status(400).json(fail('Penerima tidak valid'));
        if (!courier   || courier.role   !== 'COURIER')   return res.status(400).json(fail('Kurir tidak valid'));

        // Dana langsung dikunci di smart contract
        const { donationId, txHash } = await blockchain.createDonationOnChain(
            storeAddress, recipientAddress, courierAddress, productIds, BigInt(amount)
        );

        const donation = {
            id: uuid(), onChainId: donationId, donorAddress: req.user.walletAddress,
            storeAddress, recipientAddress, courierAddress,
            totalAmount: amount.toString(), status: 'CREATED', txHashCreate: txHash,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        await db.donations.insert(donation);

        await notify.sendToAddress(storeAddress, {
            title: '🛒 Order Donasi Baru!', body: 'Segera konfirmasi dan siapkan barang.',
        });

        return res.status(201).json(ok('Donasi berhasil dibuat. Dana terkunci di smart contract.', {
            donation, txHash,
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── GET /api/donations — list donasi sesuai role ──────────────
router.get('/', authMiddleware, async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const { walletAddress, role } = req.user;
    const colMap = {
        DONOR: 'donorAddress', STORE: 'storeAddress',
        RECIPIENT: 'recipientAddress', COURIER: 'courierAddress', ADMIN: null,
    };
    const filter = {};
    if (colMap[role]) filter[colMap[role]] = walletAddress;
    if (status)       filter.status = status;

    const all   = await db.donations.findAll(filter);
    const start = (Number(page) - 1) * Number(limit);
    return res.json(ok('Daftar donasi', {
        donations: all.slice(start, start + Number(limit)), total: all.length,
    }));
});

// ── GET /api/donations/:id — detail donasi ────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const donation = await db.donations.findById(req.params.id);
        if (!donation) return res.status(404).json(fail('Donasi tidak ditemukan'));

        let onChainData = null;
        if (donation.onChainId) {
        try { onChainData = await blockchain.getDonationFromChain(donation.onChainId); } catch (e) {}
        }
        return res.json(ok('Detail donasi', { donation, onChainData }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/donations/:id/store-confirm ─────────────────────
router.post('/:id/store-confirm', authMiddleware, requireRole('STORE'), async (req, res) => {
    try {
        const { photoNote } = req.body;
        const donation = await db.donations.findById(req.params.id);
        if (!donation) return res.status(404).json(fail('Donasi tidak ditemukan'));
        if (donation.storeAddress !== req.user.walletAddress) return res.status(403).json(fail('Bukan order Anda'));
        if (donation.status !== 'CREATED')
        return res.status(400).json(fail('Status harus CREATED, saat ini: ' + donation.status));

        const photoHash = await ipfs.uploadJSON({
        action: 'packing', donationId: donation.id,
        note: photoNote || 'Barang sudah dipacking', ts: new Date().toISOString(),
        });
        const txHash = await blockchain.storeConfirmOnChain(donation.onChainId, photoHash);

        await db.donations.update(donation.id, { status: 'STORE_CONFIRMED', packingPhotoHash: photoHash });
        await notify.sendToAddress(donation.courierAddress, {
        title: 'Barang Siap Diambil', body: 'Segera ambil dari toko.',
        });
        return res.json(ok('Konfirmasi toko berhasil', {
        packingPhotoHash: photoHash, ipfsUrl: ipfs.getIPFSUrl(photoHash), txHash,
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/donations/:id/courier-pickup ────────────────────
router.post('/:id/courier-pickup', authMiddleware, requireRole('COURIER'), async (req, res) => {
    try {
        const { photoNote } = req.body;
        const donation = await db.donations.findById(req.params.id);
        if (!donation) return res.status(404).json(fail('Donasi tidak ditemukan'));
        if (donation.courierAddress !== req.user.walletAddress) return res.status(403).json(fail('Bukan tugas Anda'));
        if (donation.status !== 'STORE_CONFIRMED')
        return res.status(400).json(fail('Status harus STORE_CONFIRMED, saat ini: ' + donation.status));

        const photoHash = await ipfs.uploadJSON({
        action: 'pickup', donationId: donation.id,
        note: photoNote || 'Barang diambil', ts: new Date().toISOString(),
        });
        const txHash = await blockchain.courierPickupOnChain(donation.onChainId, photoHash);

        await db.donations.update(donation.id, { status: 'IN_DELIVERY', pickupPhotoHash: photoHash });
        await notify.sendToAddress(donation.recipientAddress, {
        title: 'Barang Sedang Dikirim', body: 'Kurir sedang mengantar.',
        });
        return res.json(ok('Konfirmasi pengambilan berhasil', {
        pickupPhotoHash: photoHash, ipfsUrl: ipfs.getIPFSUrl(photoHash), txHash,
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/donations/:id/recipient-confirm ─────────────────
router.post('/:id/recipient-confirm', authMiddleware, requireRole('RECIPIENT'), async (req, res) => {
    try {
        const { rating, photoNote } = req.body;
        if (!rating || rating < 1 || rating > 5)
        return res.status(400).json(fail('Rating 1–5 diperlukan'));

        const donation = await db.donations.findById(req.params.id);
        if (!donation) return res.status(404).json(fail('Donasi tidak ditemukan'));
        if (donation.recipientAddress !== req.user.walletAddress) return res.status(403).json(fail('Bukan donasi Anda'));
        if (donation.status !== 'IN_DELIVERY')
        return res.status(400).json(fail('Status harus IN_DELIVERY, saat ini: ' + donation.status));

        const photoHash = await ipfs.uploadJSON({
            action: 'received', donationId: donation.id,
            rating, note: photoNote || 'Barang diterima', ts: new Date().toISOString(),
        });
        const txHash    = await blockchain.recipientConfirmOnChain(donation.onChainId, photoHash, Number(rating));
        const newStatus = Number(rating) >= 3 ? 'COMPLETED' : 'DISPUTED';

        await db.donations.update(donation.id, {
            status: newStatus, receivedPhotoHash: photoHash,
            recipientRating: Number(rating), txHashComplete: txHash,
        });

        if (newStatus === 'COMPLETED') {
        await notify.sendToAddress(donation.donorAddress, {
            title: 'Donasi Berhasil!',
            body:  'Diterima dengan rating ' + rating + '/5. Dana sudah cair ke toko. Terima kasih!',
        });
    }

    return res.json(ok('Konfirmasi berhasil. Status: ' + newStatus, {
        receivedPhotoHash: photoHash, rating: Number(rating), status: newStatus, txHash,
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

module.exports = router;