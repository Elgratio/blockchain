import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllUsers } from '../../services/api';

const CreateDonation = ({ products, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    storeAddress: '',
    recipientAddress: '',
    courierAddress: '',
    productIds: [],
    amount: '',
  });
  const [stores, setStores] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        setStores(response.data.users.filter(u => u.role === 'STORE' && u.isVerified));
        setRecipients(response.data.users.filter(u => u.role === 'RECIPIENT' && u.isVerified));
        setCouriers(response.data.users.filter(u => u.role === 'COURIER' && u.isVerified));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setFormData({
      ...formData,
      productIds: [productId],
      amount: product?.price || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeAddress || !formData.recipientAddress || !formData.courierAddress) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Select Product</label>
        <select
          className="input"
          value={selectedProduct?.id || ''}
          onChange={(e) => handleProductSelect(e.target.value)}
          required
        >
          <option value="">Choose a product...</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - Rp {Number(product.price).toLocaleString('id-ID')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Store Partner</label>
        <select
          className="input"
          value={formData.storeAddress}
          onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
          required
        >
          <option value="">Select store...</option>
          {stores.map((store) => (
            <option key={store.walletAddress} value={store.walletAddress}>
              {store.name} - {store.walletAddress.slice(0, 10)}...
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Recipient</label>
        <select
          className="input"
          value={formData.recipientAddress}
          onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
          required
        >
          <option value="">Select recipient...</option>
          {recipients.map((recipient) => (
            <option key={recipient.walletAddress} value={recipient.walletAddress}>
              {recipient.name} - {recipient.walletAddress.slice(0, 10)}...
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Courier</label>
        <select
          className="input"
          value={formData.courierAddress}
          onChange={(e) => setFormData({ ...formData, courierAddress: e.target.value })}
          required
        >
          <option value="">Select courier...</option>
          {couriers.map((courier) => (
            <option key={courier.walletAddress} value={courier.walletAddress}>
              {courier.name} - {courier.walletAddress.slice(0, 10)}...
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Total Amount (IDR)</label>
        <input
          type="text"
          className="input bg-gray-50"
          value={formData.amount ? `Rp ${Number(formData.amount).toLocaleString('id-ID')}` : ''}
          disabled
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Creating...' : 'Create Donation'}
        </button>
      </div>
    </form>
  );
};

export default CreateDonation;