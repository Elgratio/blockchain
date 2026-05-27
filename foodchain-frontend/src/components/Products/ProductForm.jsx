import React, { useState } from 'react';

const ProductForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: initialData?.price || '',
    expiryDate: initialData?.expiryDate || '',
    stock: initialData?.stock || '',
    certificationNumber: initialData?.certificationNumber || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.expiryDate || !formData.stock) {
      alert('Please fill all required fields');
      return;
    }
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Product Name *</label>
        <input
          type="text"
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Beras Premium 5kg"
          required
        />
      </div>

      <div>
        <label className="label">Price (IDR) *</label>
        <input
          type="number"
          className="input"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="e.g., 75000"
          required
        />
      </div>

      <div>
        <label className="label">Expiry Date *</label>
        <input
          type="date"
          className="input"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          min={minDateStr}
          required
        />
      </div>

      <div>
        <label className="label">Stock *</label>
        <input
          type="number"
          className="input"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          placeholder="e.g., 50"
          min="1"
          required
        />
      </div>

      <div>
        <label className="label">Certification Number</label>
        <input
          type="text"
          className="input"
          value={formData.certificationNumber}
          onChange={(e) => setFormData({ ...formData, certificationNumber: e.target.value })}
          placeholder="e.g., BPOM RI MD 12345678"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Submitting...' : (initialData ? 'Update' : 'List Product')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;