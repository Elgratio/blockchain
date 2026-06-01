import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/api';

const CreateDonation = ({ products, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    storeAddress:     '',
    recipientAddress: '',
    courierAddress:   '',
    productIds:       [],
    amount:           '',
  });
  const [recipients,       setRecipients]       = useState([]);
  const [couriers,         setCouriers]         = useState([]);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        const allUsers = response.data.users || [];
        setRecipients(allUsers.filter(u => u.role === 'RECIPIENT' && u.isVerified));
        setCouriers(allUsers.filter(u => u.role === 'COURIER' && u.isVerified));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      storeAddress: product?.storeAddress || '',
      // menggunakan onChainId (integer), bukan id (UUID)
      productIds: product?.onChainId ? [product.onChainId] : [1],
      amount:     product?.price || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeAddress || !formData.recipientAddress || !formData.courierAddress || !selectedProduct) {
      alert('Lengkapi semua field');
      return;
    }
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Pilih Produk *</label>
        <select
          className="input"
          value={selectedProduct?.id || ''}
          onChange={(e) => handleProductSelect(e.target.value)}
          required
        >
          <option value="">Pilih produk...</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} — Rp {Number(product.price).toLocaleString('id-ID')}
            </option>
          ))}
        </select>
        {selectedProduct && (
          <p className="text-xs text-green-600 mt-1">
            Toko: {selectedProduct.storeAddress?.slice(0,16)}... | OnChain ID: #{selectedProduct.onChainId}
          </p>
        )}
      </div>

      <div>
        <label className="label">Penerima Donasi *</label>
        <select
          className="input"
          value={formData.recipientAddress}
          onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
          required
        >
          <option value="">Pilih penerima...</option>
          {recipients.map((r) => (
            <option key={r.walletAddress} value={r.walletAddress}>
              {r.name} — {r.walletAddress.slice(0, 12)}...
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Kurir *</label>
        <select
          className="input"
          value={formData.courierAddress}
          onChange={(e) => setFormData({ ...formData, courierAddress: e.target.value })}
          required
        >
          <option value="">Pilih kurir...</option>
          {couriers.map((c) => (
            <option key={c.walletAddress} value={c.walletAddress}>
              {c.name} — {c.walletAddress.slice(0, 12)}...
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Total Donasi (IDR)</label>
        <input
          type="text"
          className="input bg-gray-50 cursor-not-allowed"
          value={formData.amount ? `Rp ${Number(formData.amount).toLocaleString('id-ID')}` : '—'}
          disabled
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Memproses...' : 'Buat Donasi'}
        </button>
      </div>
    </form>
  );
};

export default CreateDonation;