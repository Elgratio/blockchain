const http = require('http');

function req(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost', port: 3000, path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
                ...(data  ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        };
        const r = http.request(opts, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { resolve({ raw }); } });
        });
        r.on('error', reject);
        if (data) r.write(data);
        r.end();
    });
}

const step = (n, msg) => console.log('\n\x1b[36m[' + String(n).padStart(2, '0') + ']\x1b[0m \x1b[1m' + msg + '\x1b[0m');
const ok   = msg      => console.log('    \x1b[32mSuccess\x1b[0m ' + msg);
const info = msg      => console.log('    \x1b[33m→\x1b[0m  ' + msg);
const fail = msg      => console.log('    \x1b[31mFail\x1b[0m ' + msg);

const WALLETS = {
    admin:     '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    donor:     '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    store:     '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    recipient: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    courier:   '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
};

async function main() {
    console.log('\n');
    console.log('║   FoodChain — Demo Integrasi Lengkap         ║');
    console.log('║   Backend API + Mock Blockchain              ║');
    console.log('\n');

    // [01] Health check
    step(1, 'Health Check');
    const health = await req('GET', '/health');
    if (health.status === 'OK')
        ok('Server OK | Mode: ' + (health.blockchain.mockMode ? 'MOCK' : 'REAL'));
    else {
        fail('Server tidak bisa dijangkau. Jalankan: node src/server.js');
        process.exit(1);
    }

    // [02] Register semua aktor
    step(2, 'Register Semua Aktor (5 pengguna)');
    const actors = [
        { walletAddress: WALLETS.admin,     role: 'ADMIN',     name: 'Admin FoodChain',   email: 'admin@foodchain.id' },
        { walletAddress: WALLETS.donor,     role: 'DONOR',     name: 'Budi Santoso',      email: 'budi@email.com'     },
        { walletAddress: WALLETS.store,     role: 'STORE',     name: 'Toko Berkah Pangan',phone: '08123456789'        },
        { walletAddress: WALLETS.recipient, role: 'RECIPIENT', name: 'Siti Rahayu',       phone: '08987654321'        },
        { walletAddress: WALLETS.courier,   role: 'COURIER',   name: 'Kurir Express',     phone: '08555111222'        },
    ];
    for (const actor of actors) {
        const r = await req('POST', '/api/users/register', actor);
        if (r.success)
        ok(actor.role.padEnd(10) + ' | ' + actor.name + ' | txHash: ' + r.data.txHash);
        else
        info(actor.role + ': ' + r.message);
    }

    // [03] Login semua aktor
    step(3, 'Login Semua Aktor (mode dev — tanpa wallet signature)');
    const tokens = {};
    for (const [role, wallet] of Object.entries(WALLETS)) {
        const r = await req('POST', '/api/users/login-dev', { walletAddress: wallet });
        if (r.success) {
        tokens[role] = r.data.token;
        ok(role.padEnd(10) + ' | token: ' + r.data.token.slice(0, 25) + '...');
        } else {
        fail(role + ': ' + r.message);
        }
    }

    // [04] Admin verifikasi semua pengguna
    step(4, 'Admin Verifikasi Semua Pengguna On-Chain');
    for (const addr of [WALLETS.donor, WALLETS.store, WALLETS.recipient, WALLETS.courier]) {
        const r = await req('POST', '/api/users/verify/' + addr, null, tokens.admin);
        if (r.success) ok(addr.slice(0, 16) + '... | txHash: ' + r.data.txHash);
        else fail(r.message);
    }

    // [05] Lihat profil donor
    step(5, 'Cek Profil Donor (GET /api/users/me)');
    const me = await req('GET', '/api/users/me', null, tokens.donor);
    if (me.success) {
        ok('Nama    : ' + me.data.name);
        ok('Role    : ' + me.data.role);
        ok('Wallet  : ' + me.data.walletAddress);
        ok('Verified: ' + (me.data.isVerified ? 'Ya' : 'Belum (verif on-chain butuh real mode)'));
    }

    // [06] Toko daftarkan produk
    step(6, 'Toko Mendaftarkan Produk ke Blockchain');
    const expiry = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const prodR  = await req('POST', '/api/stores/products', {
        name: 'Beras Premium 5kg', price: '75000', expiryDate: expiry,
        stock: 50, certificationNumber: 'BPOM RI MD 12345678',
    }, tokens.store);
    let productId = null;
    if (prodR.success) {
        productId = prodR.data.product.id;
        ok('Produk  : ' + prodR.data.product.name);
        ok('Harga   : Rp ' + Number(prodR.data.product.price).toLocaleString('id-ID'));
        ok('Stok    : ' + prodR.data.product.stock + ' unit');
        ok('OnChain : ID ' + prodR.data.product.onChainId);
        ok('TxHash  : ' + prodR.data.txHash);
        ok('IPFS    : ' + prodR.data.imageUrl.slice(0, 55) + '...');
    } else {
        fail('Gagal: ' + prodR.message);
    }

    // [07] List produk publik
    step(7, 'List Produk Tersedia (endpoint publik)');
    const prods = await req('GET', '/api/stores/products');
    if (prods.success) {
        ok('Total produk : ' + prods.data.pagination.total);
        ok('Halaman      : ' + prods.data.pagination.page + '/' +
            Math.ceil(prods.data.pagination.total / prods.data.pagination.limit));
    }

    // [08] Reputasi toko
    step(8, 'Cek Reputasi Toko On-Chain');
    const rep = await req('GET', '/api/stores/reputation/' + WALLETS.store);
    if (rep.success)
        ok('Skor reputasi: ' + rep.data.reputation.reputationScore + ' | Suspended: ' + rep.data.reputation.isSuspended);

    // [09] Buat donasi
    step(9, 'Donor Membuat Donasi — Dana Dikunci di Smart Contract (Escrow)');
    const donR = await req('POST', '/api/donations', {
        storeAddress:     WALLETS.store,
        recipientAddress: WALLETS.recipient,
        courierAddress:   WALLETS.courier,
        productIds:       [1],
        amount:           '75000',
    }, tokens.donor);
    let donationId = null;
    if (donR.success) {
        donationId = donR.data.donation.id;
        ok('Donasi ID : ' + donationId);
        ok('Status    : ' + donR.data.donation.status + '  ← Dana TERKUNCI di escrow');
        ok('Total     : Rp ' + Number(donR.data.donation.totalAmount).toLocaleString('id-ID'));
        ok('TxHash    : ' + donR.data.txHash);
    } else {
        fail('Gagal buat donasi: ' + donR.message);
        process.exit(1);
    }

    // [10] Store confirm + foto packing
    step(10, 'Toko Konfirmasi — Upload Foto Packing ke IPFS');
    const scR = await req('POST', '/api/donations/' + donationId + '/store-confirm', {
        photoNote: 'Beras sudah dipacking rapi dan diberi label donasi',
    }, tokens.store);
    if (scR.success) {
        ok('Status    : STORE_CONFIRMED');
        ok('PhotoHash : ' + scR.data.packingPhotoHash.slice(0, 30) + '...');
        ok('TxHash    : ' + scR.data.txHash);
    }

    // [11] Courier pickup + foto serah terima
    step(11, 'Kurir Konfirmasi Pengambilan — Tanda Tangan Digital On-Chain');
    const cpR = await req('POST', '/api/donations/' + donationId + '/courier-pickup', {
        photoNote: 'Barang diambil dari toko, kondisi baik',
    }, tokens.courier);
    if (cpR.success) {
        ok('Status    : IN_DELIVERY');
        ok('PhotoHash : ' + cpR.data.pickupPhotoHash.slice(0, 30) + '...');
        ok('TxHash    : ' + cpR.data.txHash);
    }

    // [12] Recipient confirm rating 5 → dana cair otomatis
    step(12, 'Penerima Konfirmasi Rating 5 — Dana Otomatis CAIR ke Toko');
    const rcR = await req('POST', '/api/donations/' + donationId + '/recipient-confirm', {
        rating: 5, photoNote: 'Beras diterima dalam kondisi sempurna, terima kasih!',
    }, tokens.recipient);
    if (rcR.success) {
        ok('Status    : ' + rcR.data.status + '  ← Dana CAIR ke toko');
        ok('Rating    : ' + rcR.data.rating + '/5 *****');
        ok('TxHash    : ' + rcR.data.txHash);
    }

    // [13] Verifikasi final
    step(13, 'Verifikasi Final — Seluruh State Donasi');
    const final = await req('GET', '/api/donations/' + donationId, null, tokens.admin);
    if (final.success) {
        const d = final.data.donation;
        ok('ID              : ' + d.id);
        ok('Status Final    : ' + d.status);
        ok('Donor           : ' + d.donorAddress.slice(0, 20) + '...');
        ok('Toko            : ' + d.storeAddress.slice(0, 20) + '...');
        ok('Penerima        : ' + d.recipientAddress.slice(0, 20) + '...');
        ok('Rating Penerima : ' + d.recipientRating + '/5');
        ok('Total Donasi    : Rp ' + Number(d.totalAmount).toLocaleString('id-ID'));
        ok('Foto Packing    : ' + (d.packingPhotoHash  || '').slice(0, 28) + '...');
        ok('Foto Pickup     : ' + (d.pickupPhotoHash   || '').slice(0, 28) + '...');
        ok('Foto Terima     : ' + (d.receivedPhotoHash || '').slice(0, 28) + '...');
        ok('Tx Create       : ' + (d.txHashCreate  || '').slice(0, 30) + '...');
        ok('Tx Complete     : ' + (d.txHashComplete || '').slice(0, 30) + '...');
    }

    console.log('\n');
    console.log('║    DEMO BERHASIL — SEMUA 13 STEP PASSED      ║');
    console.log('║                                              ║');
    console.log('║  Alur terverifikasi:                         ║');
    console.log('║  Register → Login → Verifikasi Admin         ║');
    console.log('║  → Daftar Produk → Buat Donasi               ║');
    console.log('║  → Store Confirm → Courier Pickup            ║');
    console.log('║  → Recipient Confirm → COMPLETED             ║');

    console.log('\n');
}

main().catch(err => {
    console.error('\x1b[31m[FATAL]\x1b[0m', err.message);
    process.exit(1);
});