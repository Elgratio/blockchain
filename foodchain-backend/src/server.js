require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const logger    = require('./utils/logger');

const app = express();

// ── Security & Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/users',     require('./routes/users'));
app.use('/api/stores',    require('./routes/stores'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/disputes',  require('./routes/disputes'));

// ── Health Check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
    const blockchain = require('./services/blockchainService');
    let blockNumber  = 'mock';
    try { blockNumber = await blockchain.provider?.getBlockNumber?.(); } catch (e) {}

    res.json({
        status:      'OK',
        version:     '1.0.0',
        timestamp:   new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        blockchain:  {
        rpc:      process.env.RPC_URL || 'mock',
        blockNumber,
        mockMode: process.env.USE_MOCK_BLOCKCHAIN === 'true',
        },
    });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route ' + req.method + ' ' + req.path + ' tidak ditemukan',
    });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    logger.error('Unhandled: ' + err.message);
    res.status(500).json({ success: false, message: 'Internal server error', detail: err.message });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info('');
        logger.info('================================');
        logger.info('  FoodChain API Server Started  ');
        logger.info('  Port    : ' + PORT);
        logger.info('  Mode    : ' + (process.env.NODE_ENV || 'development'));
        logger.info('  Mock BC : ' + (process.env.USE_MOCK_BLOCKCHAIN || 'false'));
        logger.info('  Health  : http://localhost:' + PORT + '/health');
        logger.info('================================');
        logger.info('');
    });
}

module.exports = app;