# FoodChain: Blockchain-Based Transparent Food Donation System

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-blue)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-%5E18.2.0-61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%5E20-green)](https://nodejs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-%5E2.19.0-yellow)](https://hardhat.org/)
[![Polygon](https://img.shields.io/badge/Polygon-PoS-8247E5)](https://polygon.technology/)

> **"From Wallet to Table — Transparent, Accountable, Immutable."**

A blockchain-based food donation platform that applies the **food-not-cash** principle — donors purchase food items from verified partner stores, which are then delivered directly to verified recipients in need.

---

## 🔍 Overview

FoodChain is a decentralized application (DApp) designed to solve the transparency and accountability problems in food aid distribution. Built on **Polygon PoS** blockchain, the system uses smart contracts to create an escrow mechanism that ensures donation funds are only released when verified recipients confirm receipt of food packages.

### How It Works

1. **Donors** browse verified food products and select recipients
2. Funds are locked in a **smart contract escrow** (no direct cash to recipients)
3. **Partner stores** prepare and pack food with photo evidence (IPFS-hashed)
4. **Couriers** pick up and deliver with digital signatures
5. **Recipients** confirm receipt and rate the experience
6. Funds are **automatically released** to stores upon positive confirmation
7. All transactions are **permanently recorded on-chain** and publicly auditable

---

## ❌ Problem Statement

| Challenge | Current System | FoodChain Solution |
|-----------|---------------|-------------------|
| **Transparency** | No independent verification | All transactions on-chain, publicly auditable |
| **Misappropriation** | Cash-based, high risk | Escrow smart contract, no unilateral access |
| **Targeting** | Manual, error-prone | On-chain verified identities |
| **Quality Assurance** | No accountability | Multi-party digital signatures + IPFS evidence |
| **Trust** | Relies on intermediaries | Code-enforced rules, immutable records |

---

## ✨ Key Features

### 🔒 Blockchain-Powered Trust
- **Escrow Mechanism:** Funds locked until recipient confirmation
- **Immutable Records:** All donations permanently recorded on Polygon PoS
- **Transparent Audit Trail:** Every transaction verifiable via block explorer

### 🛡️ Quality Assurance Without IoT
- **Multi-Party Digital Signatures:** Store → Courier → Recipient confirmation chain
- **IPFS-Hashed Photo Evidence:** Tamper-proof visual documentation
- **On-Chain Reputation System:** Store ratings permanently recorded

### 👥 Role-Based Access Control
- **5 Distinct Roles:** Admin, Donor, Store, Recipient, Courier
- **Granular Permissions:** Smart contract modifiers enforce role-based actions
- **Dispute Resolution:** Transparent mediation with on-chain evidence

### 🌐 Accessible for Non-Crypto Users
- **MetaMask Integration:** For crypto-familiar users
- **Web3Auth Support:** Login via Google/email for non-crypto users
- **Dev Mode:** Simplified login for testing and demonstration

### 💰 Cost-Effective
- **Polygon PoS:** Gas fees < $0.01 per transaction
- **Affordable for Small Donations:** Economically viable for micro-donations

---

## 📜 Smart Contracts

| Contract | Responsibility | Key Functions |
|----------|---------------|---------------|
| `UserRegistry.sol` | Identity management & verification | `registerUser()`, `verifyUser()`, `suspendUser()` |
| `StoreRegistry.sol` | Product catalog & reputation system | `listProduct()`, `updateReputation()` |
| `DonationEscrow.sol` | Core donation lifecycle & escrow | `createDonation()`, `storeConfirm()`, `recipientConfirm()`, `_releaseFunds()` |
| `DisputeResolution.sol` | Transparent dispute mediation | `raiseDispute()`, `storeRespond()`, `resolveDispute()` |

### Contract Dependencies
```
DonationEscrow ──► UserRegistry (isVerified)
DonationEscrow ──► StoreRegistry (updateReputation, decreaseStock)
DisputeResolution ──► DonationEscrow (refundDonor, releaseAfterDispute)
```

---

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Smart Contract Language** | Solidity | ^0.8.20 |
| **Development Framework** | Hardhat | ^2.19.0 |
| **Security Library** | OpenZeppelin | ^5.0 |
| **Blockchain Network** | Polygon PoS (Amoy Testnet) | — |
| **Frontend** | React.js + Tailwind CSS | ^18.2.0 |
| **Web3 Library** | ethers.js | ^6 |
| **Backend** | Node.js + Express | ^20 |
| **Database** | PostgreSQL + Prisma ORM | ^15 |
| **IPFS** | Pinata SDK | — |
| **Wallet** | MetaMask / Web3Auth | — |
| **Version Control** | Git + GitHub | — |

---

## 📁 Project Structure

```
foodchain/
├── foodchain-contracts/          # Smart Contract (Hardhat)
│   ├── contracts/
│   │   ├── UserRegistry.sol
│   │   ├── StoreRegistry.sol
│   │   ├── DonationEscrow.sol
│   │   └── DisputeResolution.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── FoodChain.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── foodchain-backend/            # Backend API (Node.js)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── contracts.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── users.js
│   │   │   ├── stores.js
│   │   │   ├── donations.js
│   │   │   └── disputes.js
│   │   ├── services/
│   │   │   ├── blockchainService.js
│   │   │   └── ipfsService.js
│   │   └── utils/
│   │       ├── db.js
│   │       ├── logger.js
│   │       └── response.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   └── demo.js
│   └── package.json
│
├── foodchain-frontend/           # Frontend (React.js)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Donations.jsx
│   │   │   ├── DonationDetailPage.jsx
│   │   │   ├── Disputes.jsx
│   │   │   └── Users.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── wallet.js
│   │   └── utils/
│   └── package.json
│
├── docs/                         # Documentation
│   ├── diagrams/
│   │   └── *.puml                # PlantUML diagrams
│   ├── paper/
│   │   └── FoodChain_Paper.tex   # IEEE format paper
│   └── README.md
│
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= v18.0.0
- **npm** >= v9.0.0
- **MetaMask** browser extension
- **Git**

**Optional for Production:**
- Polygon Amoy Testnet (from [Polygon Faucet](https://faucet.polygon.technology/))
- Alchemy/Infura API key for RPC endpoint
- Pinata API key for IPFS

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Elgratio/foodchain.git
cd foodchain
```

#### Smart Contract Setup

```bash
# 2. Install smart contract dependencies
cd foodchain-contracts
npm install

# 3. Compile contracts
npx hardhat compile

# Expected output:
# Compiled 4 Solidity files successfully (evm target: paris).
```

#### Backend Setup

```bash
# 4. Install backend dependencies
cd ../foodchain-backend
npm install

# 5. Create environment file
cp .env.example .env
# Edit .env with your configuration
```

#### Frontend Setup

```bash
# 6. Install frontend dependencies
cd ../foodchain-frontend
npm install
```

### Configuration

**`foodchain-backend/.env`**
```env
# Server
PORT=3000
NODE_ENV=development

# Blockchain
RPC_URL=http://localhost:8545
CHAIN_ID=80002
PRIVATE_KEY=your_private_key_here

# Contract Addresses (from deployment)
USER_REGISTRY_ADDRESS=0x...
STORE_REGISTRY_ADDRESS=0x...
DONATION_ESCROW_ADDRESS=0x...
DISPUTE_RESOLUTION_ADDRESS=0x...

# Database (optional for production)
DATABASE_URL=postgresql://user:password@localhost:5432/foodchain

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# JWT
JWT_SECRET=your_jwt_secret_here

# Mode (mock | real)
BLOCKCHAIN_MODE=mock
```

### Running the System

You need four terminal windows for full local development:

#### Terminal 1: Start Hardhat Local Node
```bash
cd foodchain-contracts
npx hardhat node
```

#### Terminal 2: Deploy Smart Contracts
```bash
cd foodchain-contracts
npx hardhat run scripts/deploy.js --network localhost
# Copy deployed contract addresses to backend .env
```

#### Terminal 3: Start Backend Server
```bash
cd foodchain-backend
node src/server.js
# Server running at http://localhost:3000
```

#### Terminal 4: Start Frontend
```bash
cd foodchain-frontend
npm start
# App running at http://localhost:3001
```

### Demo Script

Run the automated end-to-end demo that executes all 13 steps of the donation flow:

```bash
cd foodchain-backend
node scripts/demo.js
```

**Expected Output:**
```
╔══════════════════════════════════════════════╗
║   FoodChain — Demo Integrasi Lengkap         ║
╚══════════════════════════════════════════════╝

[01] Health Check
    Server OK | Mode: MOCK

[02] Register Semua Aktor (5 pengguna)
    ADMIN      | Admin FoodChain
    DONOR      | Budi Santoso
    STORE      | Toko Berkah
    RECIPIENT  | Keluarga Siti Rahayu
    COURIER    | Kurir Express

[03] Admin Verifikasi Semua Pengguna
    All users verified

[04] Store Daftarkan Produk
    Beras Premium 5kg (ID: 1)
    Minyak Goreng 2L (ID: 2)

[05] Donor Lihat Katalog Produk
    2 products available

[06] Donor Buat Donasi — Dana Dikunci
    Status    : CREATED
    TxHash    : 0xMOCK_...

[07] Store Konfirmasi Packing
    Status    : STORE_CONFIRMED

[08] Courier Konfirmasi Pickup
    Status    : IN_DELIVERY

[09] Recipient Konfirmasi + Rating 5
    Status    : COMPLETED
    Rating    : 5/5 

╔══════════════════════════════════════════════╗
║   DEMO BERHASIL — SEMUA 13 STEP PASSED       ║
╚══════════════════════════════════════════════╝
```

---

## 👥 Actors & Roles

| Actor | Description | Key Actions |
|-------|-------------|-------------|
| **Admin** 👨‍💼 | Platform manager | Verify users, mediate disputes, monitor platform |
| **Donor** 👤 | Food donation funder | Browse products, create donations, track delivery |
| **Store** 🏪 | Verified food provider | List products, confirm packing, receive payment |
| **Recipient** 🙏 | Beneficiary in need | Confirm receipt, rate experience, file disputes |
| **Courier** 🚚 | Delivery personnel | Confirm pickup, deliver to recipient |

---

## 📡 API Documentation

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | Public | Server & blockchain status |
| `POST` | `/api/users/register` | Public | Register new user |
| `POST` | `/api/users/login` | Public | Wallet signature login |
| `POST` | `/api/users/login-dev` | Dev | Simplified dev login |
| `GET` | `/api/users/me` | Auth | User profile |
| `POST` | `/api/users/verify/:address` | Admin | Verify user on-chain |
| `GET` | `/api/stores/products` | Public | List products |
| `POST` | `/api/stores/products` | Store | Register product |
| `GET` | `/api/stores/reputation/:addr` | Public | Store reputation |
| `POST` | `/api/donations` | Donor | Create donation |
| `GET` | `/api/donations` | Auth | List donations |
| `GET` | `/api/donations/:id` | Auth | Donation detail |
| `POST` | `/api/donations/:id/store-confirm` | Store | Confirm packing |
| `POST` | `/api/donations/:id/courier-pickup` | Courier | Confirm pickup |
| `POST` | `/api/donations/:id/recipient-confirm` | Recipient | Confirm receipt + rating |
| `POST` | `/api/disputes` | Recipient | File dispute |
| `POST` | `/api/disputes/:id/respond` | Store | Respond to dispute |
| `POST` | `/api/disputes/:id/resolve` | Admin | Resolve dispute |

---

## 🧪 Testing

### Smart Contract Unit Tests
```bash
cd foodchain-contracts
npx hardhat test
```

### Gas Report
```bash
cd foodchain-contracts
REPORT_GAS=true npx hardhat test
```

### Backend API Testing
Import `FoodChain.postman_collection.json` into Postman.

### End-to-End Demo
```bash
cd foodchain-backend
node scripts/demo.js
```

---

## 🚢 Deployment

### Deploy to Polygon Amoy Testnet

```bash
cd foodchain-contracts

# Configure hardhat.config.js with Amoy network
npx hardhat run scripts/deploy.js --network polygonAmoy
```

### Verify Contracts on PolygonScan
```bash
npx hardhat verify --network polygonAmoy DEPLOYED_CONTRACT_ADDRESS
```

---

## 👨‍💻 Contributors

| Name             | NPM   | Role                             |
| ---------------- | ----- | -------------------------------- |
| [Diva Hana] | [2006529543] | Project Manager, Frontend Developer |
| [Rain Elgratio] | [2006577574] | Backend Developer, Frontend Development, Smartcontract |

**Program Studi Teknik Komputer**  
**Departemen Teknik Elektro, Fakultas Teknik**  
**Universitas Indonesia — 2026**

---

<p align="center">
  <b>FoodChain</b><br>
  <i>Transparent Donations, Nourished Communities</i><br>
  <sub>Universitas Indonesia 2026</sub>
</p>