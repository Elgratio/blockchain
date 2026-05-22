const fs     = require('fs');
const path   = require('path');
const logger = require('./logger');

const DB_FILE = path.join(__dirname, '../../foodchain-db.json');

// Load atau inisialisasi database
let store = { users: {}, products: {}, donations: {}, disputes: {} };
    if (fs.existsSync(DB_FILE)) {
    try {
        store = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        logger.warn('DB file corrupt, starting fresh');
    }
}

function save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

const db = {
    // ── Users ───────────────────────────────────────────────────
    users: {
        insert:       (u)       => { store.users[u.walletAddress] = u; save(); return u; },
        findByWallet: (w)       => store.users[w] || null,
        findAll:      ()        => Object.values(store.users),
        update:       (w, fields) => {
        if (store.users[w]) {
            Object.assign(store.users[w], fields, { updatedAt: new Date().toISOString() });
            save();
        }
        },
    },

    // ── Products ─────────────────────────────────────────────────
    products: {
        insert:         (p)   => { store.products[p.id] = p; save(); return p; },
        findById:       (id)  => store.products[id] || null,
        findByOnChainId:(oid) => Object.values(store.products).find(p => p.onChainId === oid) || null,
        findAll:        (filter = {}) => Object.values(store.products).filter(p =>
        (!filter.storeAddress || p.storeAddress === filter.storeAddress) &&
        (!filter.isAvailable  || p.isAvailable  === filter.isAvailable)
        ),
        update: (id, fields) => {
        if (store.products[id]) { Object.assign(store.products[id], fields); save(); }
        },
    },

    // ── Donations ─────────────────────────────────────────────────
    donations: {
        insert:   (d)   => { store.donations[d.id] = d; save(); return d; },
        findById: (id)  => store.donations[id] || null,
        findAll:  (filter = {}) => Object.values(store.donations).filter(d =>
        (!filter.donorAddress     || d.donorAddress     === filter.donorAddress)     &&
        (!filter.storeAddress     || d.storeAddress     === filter.storeAddress)     &&
        (!filter.recipientAddress || d.recipientAddress === filter.recipientAddress) &&
        (!filter.courierAddress   || d.courierAddress   === filter.courierAddress)   &&
        (!filter.status           || d.status           === filter.status)
        ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        update: (id, fields) => {
        if (store.donations[id]) {
            Object.assign(store.donations[id], fields, { updatedAt: new Date().toISOString() });
            save();
        }
        },
    },

    // ── Disputes ──────────────────────────────────────────────────
    disputes: {
        insert:          (d)          => { store.disputes[d.donationId] = d; save(); return d; },
        findByDonation:  (donationId) => store.disputes[donationId] || null,
        update:          (donationId, fields) => {
        if (store.disputes[donationId]) { Object.assign(store.disputes[donationId], fields); save(); }
        },
    },

    // Hapus semua data (untuk testing ulang)
    clear: () => { store = { users:{}, products:{}, donations:{}, disputes:{} }; save(); },
};

logger.info('Database JSON ready  → ' + DB_FILE);
module.exports = db;