const logger = require('../utils/logger');
const crypto = require('crypto');

function mockHash(data) {
    const h = crypto.createHash('sha256')
        .update(JSON.stringify(data) + Date.now())
        .digest('hex');
    return 'bafkrei' + h.slice(0, 38);
}

class IPFSService {
    async uploadJSON(data, name = 'data') {
        const hash = mockHash(data);
        logger.info('[IPFS] JSON → ' + name + ' : ' + hash.slice(0, 20) + '...');
        return hash;
    }
    async uploadFile(buffer, name = 'file') {
        const hash = mockHash({ name, size: buffer?.length || 0 });
        logger.info('[IPFS] File → ' + name + ' : ' + hash.slice(0, 20) + '...');
        return hash;
    }
    getIPFSUrl(hash) {
        return 'https://gateway.pinata.cloud/ipfs/' + hash;
    }
}

module.exports = new IPFSService();