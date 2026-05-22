const jwt         = require('jsonwebtoken');
const { ethers }  = require('ethers');
const env         = require('../config/env');
const db          = require('../utils/db');
const { fail }    = require('../utils/response');

// Verifikasi signature wallet (login tanpa password)
function verifyWalletSignature(message, signature, expectedAddress) {
    try {
        const recovered = ethers.verifyMessage(message, signature);
        return recovered.toLowerCase() === expectedAddress.toLowerCase();
    } catch {
        return false;
    }
}

// Generate JWT token setelah login
function generateToken(walletAddress, role) {
    return jwt.sign({ walletAddress, role }, env.JWT_SECRET, { expiresIn: '7d' });
}

// Middleware: cek token JWT di setiap request
async function authMiddleware(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
        return res.status(401).json(fail('Token tidak ditemukan di header Authorization'));

        const token   = header.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user    = db.users.findByWallet(decoded.walletAddress);

        if (!user || !user.isActive)
        return res.status(401).json(fail('Akun tidak aktif atau tidak ditemukan'));

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json(fail('Token tidak valid atau sudah expired'));
    }
}

// Middleware: cek role pengguna
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
        return res.status(403).json(
            fail('Akses ditolak. Role diperlukan: ' + roles.join(' / '))
        );
        next();
    };
}

module.exports = { authMiddleware, verifyWalletSignature, generateToken, requireRole };