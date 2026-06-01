import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listProducts, getAllUsers, createDonation, getDonations } from '../../services/api';
import {
  FiPackage, FiUser, FiDollarSign, FiCheckCircle,
  FiArrowRight, FiClock, FiTruck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const DonationDemo = () => {
  const { user, balance, refreshBalance } = useAuth();
  const [step,              setStep]              = useState(1);
  const [products,          setProducts]          = useState([]);
  const [users,             setUsers]             = useState([]);
  const [selectedProduct,   setSelectedProduct]   = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedStore,     setSelectedStore]     = useState(null);
  const [selectedCourier,   setSelectedCourier]   = useState(null);
  const [donation,          setDonation]          = useState(null);
  const [donations,         setDonations]         = useState([]);
  const [loading,           setLoading]           = useState(false);

  useEffect(() => {
    fetchData();
    fetchDonations();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        listProducts(),
        getAllUsers(),
      ]);
      if (productsRes.success) setProducts(productsRes.data.products || []);
      if (usersRes.success)    setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await getDonations();
      if (response.success) setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    }
  };

  const handleCreateDonation = async () => {
    // cek selectedStore juga
    if (!selectedProduct || !selectedStore || !selectedRecipient || !selectedCourier) {
      toast.error('Lengkapi semua pilihan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const donationData = {
        storeAddress:     selectedStore.walletAddress,
        recipientAddress: selectedRecipient.walletAddress,
        courierAddress:   selectedCourier.walletAddress,
        // menggunakan onChainId (integer)
        productIds: [selectedProduct.onChainId || 1],
        amount:     selectedProduct.price,
      };

      const response = await createDonation(donationData);
      if (response.success) {
        setDonation(response.data.donation);
        setStep(2);
        toast.success('Donasi berhasil dibuat! Dana terkunci di smart contract.');
        fetchDonations();
        refreshBalance();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat donasi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':    return <FiCheckCircle className="text-green-500" />;
      case 'CREATED':      return <FiClock className="text-yellow-500" />;
      case 'IN_DELIVERY':  return <FiTruck className="text-blue-500" />;
      default:             return <FiPackage className="text-gray-500" />;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-1">Demo Alur Donasi</h3>
        <p className="text-sm text-blue-600">Ikuti langkah berikut untuk membuat donasi end-to-end.</p>
      </div>

      {/* Select Product */}
      <div>
        <label className="label flex items-center gap-2">
          <FiPackage /> 1. Pilih Produk untuk Didonasikan
        </label>
        <select
          className="input"
          value={selectedProduct?.id || ''}
          onChange={(e) => {
            const product = products.find(p => p.id === e.target.value);
            setSelectedProduct(product);
            // Auto-set store dari produk
            if (product) {
              const store = users.find(u => u.walletAddress === product.storeAddress);
              setSelectedStore(store || null);
            }
          }}
        >
          <option value="">Pilih produk...</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} — Rp {Number(product.price).toLocaleString('id-ID')}
              {product.onChainId ? ` (ID #${product.onChainId})` : ''}
            </option>
          ))}
        </select>
        {selectedProduct && (
          <p className="mt-1 text-sm text-green-600">
            ✓ Produk: {selectedProduct.name} | Toko: {selectedStore?.name || selectedProduct.storeAddress?.slice(0,12)+'...'}
          </p>
        )}
      </div>

      {/* Select Recipient */}
      <div>
        <label className="label flex items-center gap-2">
          <FiUser /> 2. Pilih Penerima Donasi
        </label>
        <select
          className="input"
          value={selectedRecipient?.walletAddress || ''}
          onChange={(e) => {
            const recipient = users.find(u => u.walletAddress === e.target.value);
            setSelectedRecipient(recipient);
          }}
        >
          <option value="">Pilih penerima...</option>
          {users.filter(u => u.role === 'RECIPIENT' && u.isVerified).map(r => (
            <option key={r.walletAddress} value={r.walletAddress}>
              {r.name} — {r.walletAddress.slice(0, 12)}...
            </option>
          ))}
        </select>
      </div>

      {/* Select Courier */}
      <div>
        <label className="label flex items-center gap-2">
          <FiTruck /> 3. Pilih Kurir
        </label>
        <select
          className="input"
          value={selectedCourier?.walletAddress || ''}
          onChange={(e) => {
            const courier = users.find(u => u.walletAddress === e.target.value);
            setSelectedCourier(courier);
          }}
        >
          <option value="">Pilih kurir...</option>
          {users.filter(u => u.role === 'COURIER' && u.isVerified).map(c => (
            <option key={c.walletAddress} value={c.walletAddress}>
              {c.name} — {c.walletAddress.slice(0, 12)}...
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {selectedProduct && selectedStore && selectedRecipient && selectedCourier && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <h4 className="font-semibold text-gray-800">Ringkasan Donasi</h4>
          <p><span className="text-gray-500">Produk   :</span> {selectedProduct.name}</p>
          <p><span className="text-gray-500">Harga    :</span> Rp {Number(selectedProduct.price).toLocaleString('id-ID')}</p>
          <p><span className="text-gray-500">Toko     :</span> {selectedStore.name}</p>
          <p><span className="text-gray-500">Penerima :</span> {selectedRecipient.name}</p>
          <p><span className="text-gray-500">Kurir    :</span> {selectedCourier.name}</p>
          <p className="text-xs text-gray-400 mt-1">
            Dana akan dikunci di smart contract hingga penerima konfirmasi.
          </p>
        </div>
      )}

      {/* cek selectedStore juga */}
      <button
        onClick={handleCreateDonation}
        disabled={!selectedProduct || !selectedStore || !selectedRecipient || !selectedCourier || loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Membuat Donasi...' : (<><span>Buat Donasi</span><FiArrowRight /></>)}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FiCheckCircle className="text-green-600" />
          <h3 className="font-semibold text-green-800">Donasi Berhasil Dibuat!</h3>
        </div>
        <p className="text-sm text-green-600">
          Dana terkunci di smart contract escrow. Toko akan segera memproses pesanan.
        </p>
      </div>

      {donation && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Detail Donasi</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Donation ID:</span>
              <span className="font-mono text-xs">{donation.id?.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">OnChain ID:</span>
              <span className="font-medium">#{donation.onChainId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="text-yellow-600 font-medium">{donation.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dana Terkunci:</span>
              <span className="text-primary-600 font-semibold">
                Rp {Number(donation.totalAmount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tx Hash:</span>
              <span className="font-mono text-xs text-blue-600">{donation.txHashCreate?.slice(0, 20)}...</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">Langkah Selanjutnya:</h4>
        <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
          <li>Toko konfirmasi dan packing barang → Login sebagai Store</li>
          <li>Kurir ambil barang → Login sebagai Courier</li>
          <li>Penerima konfirmasi dan beri rating → Login sebagai Recipient</li>
          <li>Dana otomatis cair ke toko</li>
        </ol>
      </div>

      <button
        onClick={() => {
          setStep(1);
          setSelectedProduct(null);
          setSelectedRecipient(null);
          setSelectedStore(null);
          setSelectedCourier(null);
          setDonation(null);
        }}
        className="btn-outline w-full"
      >
        Buat Donasi Lain
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-primary-100 text-sm">Saldo Wallet Anda</p>
            <p className="text-3xl font-bold mt-1">
              {balance ? `${parseFloat(balance).toFixed(4)} MATIC` : '0 MATIC'}
            </p>
            <p className="text-primary-100 text-xs mt-1 font-mono">
              {user?.walletAddress?.slice(0, 16)}...{user?.walletAddress?.slice(-4)}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <FiDollarSign className="text-2xl" />
          </div>
        </div>
      </div>

      {/* Demo Form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <FiPackage className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Demo Donasi</h2>
        </div>

        {/* Step indicator */}
        <div className="flex mb-6">
          {[
            { n: 1, label: 'Buat Donasi' },
            { n: 2, label: 'Konfirmasi' },
          ].map(s => (
            <div key={s.n} className={`flex-1 text-center pb-2 border-b-2 text-sm transition-colors ${
              step >= s.n ? 'border-primary-600 text-primary-600 font-medium' : 'border-gray-200 text-gray-400'
            }`}>
              Step {s.n}: {s.label}
            </div>
          ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>

      {/* Recent donations */}
      {donations.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Donasi Terbaru</h3>
          <div className="space-y-3">
            {donations.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(d.status)}
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      Donasi #{d.id?.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600 text-sm">
                    Rp {Number(d.totalAmount).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">{d.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationDemo;