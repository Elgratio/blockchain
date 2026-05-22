# FoodChain Frontend

Frontend sederhana untuk platform donasi makanan blockchain FoodChain. Dibangun dengan React 19, TypeScript, dan Tailwind CSS.

## 🚀 Fitur Utama

### Autentikasi
- **Dev Login**: Login tanpa signature untuk development (hanya di development mode)
- **Wallet Connection**: Dukungan untuk wallet signature authentication
- **Role-Based Access**: Sistem role berbeda untuk Donor, Store, Recipient, dan Courier

### Dashboard
- **Profil Pengguna**: Lihat informasi akun dan status verifikasi
- **Manajemen Donasi**: Lihat semua donasi yang terkait dengan akun Anda
- **Manajemen Produk** (untuk Store): Tambah dan kelola produk yang akan didonasikan

### Halaman Utama
- **Login/Register**: Registrasi pengguna baru dan login
- **Products**: Daftar produk tersedia dengan pagination
- **Create Donation**: Buat donasi baru dengan memilih produk
- **Create Product** (Store only): Tambah produk baru

## 📋 Persyaratan

- Node.js 18+
- pnpm (atau npm)
- Backend FoodChain berjalan di `http://localhost:3000`

## 🔧 Setup

### 1. Install Dependencies
```bash
cd foodchain-frontend
pnpm install
```

### 2. Konfigurasi Environment
Buat file `.env` di root project (opsional):
```env
VITE_API_URL=http://localhost:3000/api
```

Jika tidak ada, frontend akan menggunakan default `http://localhost:3000/api`.

### 3. Development
```bash
pnpm dev
```

Server akan berjalan di `http://localhost:5173` (atau port lain jika sudah digunakan).

### 4. Production Build
```bash
pnpm build
pnpm preview
```

## 📁 Struktur Project

```
client/
├── src/
│   ├── pages/              # Halaman aplikasi
│   │   ├── Login.tsx       # Login & Register
│   │   ├── Dashboard.tsx   # Dashboard utama
│   │   ├── Products.tsx    # Daftar produk
│   │   ├── CreateDonation.tsx
│   │   └── CreateProduct.tsx
│   ├── components/         # Komponen UI reusable
│   ├── contexts/
│   │   ├── AuthContext.tsx # Auth state management
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   └── api.ts          # API client untuk backend
│   ├── App.tsx             # Main router
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static files
└── index.html
```

## 🔌 API Integration

Frontend terhubung ke backend FoodChain melalui API client di `client/src/lib/api.ts`.

### Endpoints yang Digunakan

#### Users
- `POST /api/users/register` - Registrasi pengguna baru
- `POST /api/users/login` - Login dengan signature
- `POST /api/users/login-dev` - Dev login (development only)
- `GET /api/users/me` - Ambil data pengguna saat ini

#### Stores
- `GET /api/stores/products` - Daftar produk tersedia
- `GET /api/stores/my-products` - Produk milik toko saya
- `POST /api/stores/products` - Tambah produk baru
- `GET /api/stores/reputation/:address` - Reputasi toko

#### Donations
- `POST /api/donations` - Buat donasi baru
- `GET /api/donations` - Daftar donasi dengan filter
- `GET /api/donations/:id` - Detail donasi
- `POST /api/donations/:id/store-confirm` - Konfirmasi toko
- `POST /api/donations/:id/courier-pickup` - Pickup kurir
- `POST /api/donations/:id/recipient-confirm` - Konfirmasi penerima

#### Disputes
- `POST /api/disputes/:id/raise` - Buat dispute
- `GET /api/disputes/:id` - Detail dispute
- `POST /api/disputes/:id/resolve` - Resolve dispute

## 🎨 Design & Styling

- **Framework**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Font**: Poppins (Google Fonts)
- **Theme**: Light mode (default)

## 🔐 Autentikasi

### Dev Mode (Development)
```typescript
// Cukup masukkan wallet address
await api.loginDev('0x...');
```

### Production Mode
```typescript
// Perlu signature dari wallet
const message = 'Sign this message to login';
const signature = await wallet.signMessage(message);
await api.loginWithSignature({
  walletAddress: '0x...',
  signature,
  message
});
```

Token disimpan di localStorage dan otomatis ditambahkan ke setiap request.

## 📱 Responsive Design

Frontend fully responsive dengan breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🐛 Troubleshooting

### "API Error" saat login/register
- Pastikan backend FoodChain berjalan di `http://localhost:3000`
- Cek console browser untuk error detail
- Pastikan wallet address valid

### Token expired
- Token berlaku 7 hari
- Setelah expired, user perlu login ulang
- Token disimpan di localStorage

### CORS Error
- Pastikan backend memiliki CORS configuration yang benar
- Cek `Access-Control-Allow-Origin` header

## 📝 Development Notes

### Menambah Halaman Baru
1. Buat file di `client/src/pages/`
2. Tambahkan route di `App.tsx`
3. Import dan gunakan komponen

### Menambah API Endpoint
1. Tambahkan method di `client/src/lib/api.ts`
2. Gunakan di komponen dengan `api.methodName()`

### Styling
- Gunakan Tailwind utilities
- Untuk custom styles, edit `client/src/index.css`
- Hindari inline styles

## 🚀 Deployment

Frontend dapat di-deploy ke:
- Manus (built-in hosting)
- Vercel
- Netlify
- GitHub Pages
- Self-hosted server

Untuk Manus, gunakan tombol "Publish" di Management UI setelah membuat checkpoint.

## 📞 Support

Untuk issues atau pertanyaan:
1. Cek console browser (F12)
2. Lihat network tab untuk API errors
3. Cek backend logs
4. Baca dokumentasi backend di `FoodChain_M3_Backend_Complete.md`

## 📄 License

MIT
