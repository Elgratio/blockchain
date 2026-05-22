const logger = require('../utils/logger');

// Stub push notification — log ke console
// Untuk produksi: integrasikan Firebase Admin SDK

async function sendToAddress(walletAddress, { title, body, data = {} }) {
    logger.info(
        '[NOTIF] → ' + walletAddress.slice(0, 10) + '... | ' + title + ': ' + body
    );
    return true;
}

async function sendToToken(fcmToken, payload) {
    logger.info('[NOTIF FCM] ' + JSON.stringify(payload?.notification || payload));
    return true;
}

module.exports = { sendToAddress, sendToToken };