const express    = require('express');
const router     = express.Router();
const { v4: uuid } = require('uuid');
const db         = require('../utils/db');
const blockchain = require('../services/blockchainService');
const ipfs       = require('../services/ipfsService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// ── POST /api/disputes — ajukan komplain ─────────────────────
router.post('/', authMiddleware, requireRole('RECIPIENT'), async (req, res) => {
    try {
        const { donationId, evidenceNote } = req.body;
        if (!donationId) return res.status(400).json(fail('donationId diperlukan'));

        const donation = await db.donations.findById(donationId);
        if (!donation) return res.status(404).json(fail('Donasi tidak ditemukan'));
        if (donation.recipientAddress !== req.user.walletAddress)
        return res.status(403).json(fail('Bukan donasi Anda'));
        if (donation.status !== 'DISPUTED')
        return res.status(400).json(fail('Status donasi harus DISPUTED (terjadi saat rating < 3)'));
        if (await db.disputes.findByDonation(donationId))
        return res.status(409).json(fail('Dispute sudah ada untuk donasi ini'));

        const evidenceHash = await ipfs.uploadJSON({
        action: 'evidence', donationId,
        note: evidenceNote || 'Barang bermasalah', ts: new Date().toISOString(),
        });
        const txHash = await blockchain.raiseDisputeOnChain(donation.onChainId, evidenceHash);

        const dispute = {
        id: uuid(), donationId, raisedBy: req.user.walletAddress,
        evidenceHash, result: 'PENDING', raisedAt: new Date().toISOString(),
        };
        await db.disputes.insert(dispute);

        return res.status(201).json(ok('Dispute berhasil diajukan. Dana tetap terkunci.', {
        dispute, evidenceUrl: ipfs.getIPFSUrl(evidenceHash), txHash,
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/disputes/:donationId/respond — toko merespons ──
router.post('/:donationId/respond', authMiddleware, requireRole('STORE'), async (req, res) => {
    try {
        const { donationId } = req.params;
        const { responseNote } = req.body;

        const dispute = await db.disputes.findByDonation(donationId);
        if (!dispute) return res.status(404).json(fail('Dispute tidak ditemukan'));
        if (dispute.result !== 'PENDING') return res.status(400).json(fail('Dispute sudah diselesaikan'));

        const responseHash = await ipfs.uploadJSON({
            action: 'response', donationId,
            note: responseNote || 'Barang sudah sesuai', ts: new Date().toISOString(),
        });
        await db.disputes.update(donationId, { storeResponseHash: responseHash });

        return res.json(ok('Respons berhasil dikirim', {
            responseHash, responseUrl: ipfs.getIPFSUrl(responseHash),
        }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── POST /api/disputes/:donationId/resolve — admin putuskan ──
router.post('/:donationId/resolve', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    try {
        const { donationId } = req.params;
        const { result, resolutionNotes } = req.body;

        if (!['STORE_WIN', 'DONOR_WIN'].includes(result))
        return res.status(400).json(fail('result harus STORE_WIN atau DONOR_WIN'));

        const donation = await db.donations.findById(donationId);
        const dispute  = await db.disputes.findByDonation(donationId);
        if (!donation || !dispute) return res.status(404).json(fail('Donasi/dispute tidak ditemukan'));

        const notesHash   = await ipfs.uploadJSON({
            notes: resolutionNotes, result,
            resolvedBy: req.user.walletAddress, ts: new Date().toISOString(),
        });
        const txHash      = await blockchain.resolveDisputeOnChain(donation.onChainId, result, notesHash);
        const finalStatus = result === 'DONOR_WIN' ? 'REFUNDED' : 'COMPLETED';

        await db.donations.update(donationId, { status: finalStatus });
        await db.disputes.update(donationId, {
            result, resolvedBy: req.user.walletAddress,
            resolutionNotes: resolutionNotes || '', resolvedAt: new Date().toISOString(),
        });

        return res.json(ok('Dispute selesai: ' + result, { result, finalStatus, txHash }));
    } catch (err) {
        return res.status(500).json(fail(err.message));
    }
});

// ── GET /api/disputes/:donationId — detail dispute ────────────
router.get('/:donationId', authMiddleware, async (req, res) => {
    const dispute = await db.disputes.findByDonation(req.params.donationId);
    if (!dispute) return res.status(404).json(fail('Dispute tidak ditemukan'));
    return res.json(ok('Detail dispute', { dispute }));
});

module.exports = router;