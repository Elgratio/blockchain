import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getDonations, 
  createDonation, 
  listProducts, 
  getRecipients, 
  getCouriers,
  getStores 
} from '../services/api';
import DonationList from '../components/Donations/DonationList';
import { FiPlus, FiPackage, FiUser, FiTruck, FiCheckCircle, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import Modal from '../components/Common/Modal';
import toast from 'react-hot-toast';

const Donations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
    fetchFormData();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await getDonations();
      if (response.success) {
        setDonations(response.data.donations || []);
      }
    } catch (error) {
      console.error('Failed to fetch donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchFormData function to handle response correctly

  const fetchFormData = async () => {
    setDataLoading(true);
    try {
      // Fetch all data in parallel
      const [productsRes, recipientsRes, couriersRes, storesRes] = await Promise.all([
        listProducts(),
        getRecipients(),
        getCouriers(),
        getStores()
      ]);
      
      console.log('Products response:', productsRes);
      console.log('Recipients response:', recipientsRes);
      console.log('Couriers response:', couriersRes);
      console.log('Stores response:', storesRes);
      
      if (productsRes.success) {
        setProducts(productsRes.data.products || []);
        console.log('Products loaded:', productsRes.data.products?.length);
      }
      
      if (recipientsRes.success) {
        setRecipients(recipientsRes.data.recipients || []);
        console.log('Recipients loaded:', recipientsRes.data.recipients?.length);
      }
      
      if (couriersRes.success) {
        setCouriers(couriersRes.data.couriers || []);
        console.log('Couriers loaded:', couriersRes.data.couriers?.length);
      }
      
      if (storesRes.success) {
        setStores(storesRes.data.stores || []);
        console.log('Stores loaded:', storesRes.data.stores?.length);
      }
    } catch (error) {
      console.error('Failed to fetch form data:', error);
      toast.error('Failed to load data for donation creation');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateDonation = async () => {
    if (!selectedProduct || !selectedRecipient || !selectedStore || !selectedCourier) {
      toast.error('Please complete all selections');
      return;
    }

    setCreating(true);
    try {
      const donationData = {
        storeAddress: selectedStore.walletAddress,
        recipientAddress: selectedRecipient.walletAddress,
        courierAddress: selectedCourier.walletAddress,
        productIds: [selectedProduct.id],
        amount: selectedProduct.price,
      };

      const response = await createDonation(donationData);
      if (response.success) {
        toast.success('Donation created successfully!');
        setShowModal(false);
        resetForm();
        fetchDonations();
        fetchFormData(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create donation');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedRecipient(null);
    setSelectedStore(null);
    setSelectedCourier(null);
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    // Find the store that owns this product
    const store = stores.find(s => s.walletAddress === product?.storeAddress);
    setSelectedStore(store);
  };

  const refreshData = () => {
    fetchFormData();
    fetchDonations();
  };

  if (loading || dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-500">Loading donations...</p>
      </div>
    );
  }

  const availableProducts = products.filter(p => p.isAvailable);
  const availableRecipients = recipients.filter(r => r.isVerified && r.isActive);
  const availableCouriers = couriers.filter(c => c.isVerified && c.isActive);

  console.log('=== Donation Page Debug ===');
  console.log('User role:', user?.role);
  console.log('Products:', products.length);
  console.log('Available Products:', availableProducts.length);
  console.log('Recipients:', recipients.length);
  console.log('Available Recipients:', availableRecipients.length);
  console.log('Couriers:', couriers.length);
  console.log('Available Couriers:', availableCouriers.length);
  console.log('==========================');

  const canCreateDonation = user?.role === 'DONOR' && 
    availableProducts.length > 0 && 
    availableRecipients.length > 0 && 
    availableCouriers.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Donations</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'DONOR' 
              ? 'Create new donations and track your contributions' 
              : 'Track and manage your donations'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={refreshData} className="btn-outline flex items-center space-x-2">
            <FiRefreshCw className={dataLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          {canCreateDonation && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
              <FiPlus />
              <span>Create Donation</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'my'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Donations ({donations.length})
          </button>
          {user?.role === 'DONOR' && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create New
            </button>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'my' && (
        <DonationList donations={donations} userRole={user?.role} />
      )}

      {activeTab === 'create' && user?.role === 'DONOR' && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <FiPackage className="text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Create New Donation</h2>
          </div>

          {availableProducts.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">No products available for donation at the moment.</p>
              <p className="text-yellow-600 text-sm mt-1">Please check back later.</p>
            </div>
          ) : availableRecipients.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">No verified recipients available.</p>
              <p className="text-yellow-600 text-sm mt-1">Please wait for admin to verify recipients.</p>
            </div>
          ) : availableCouriers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">No verified couriers available.</p>
              <p className="text-yellow-600 text-sm mt-1">Please wait for admin to verify couriers.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Select Product */}
              <div>
                <label className="label flex items-center">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">1</span>
                  Select Product to Donate
                </label>
                <select
                  className="input"
                  value={selectedProduct?.id || ''}
                  onChange={(e) => handleProductSelect(e.target.value)}
                >
                  <option value="">Choose a product...</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Rp {Number(product.price).toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
                {selectedProduct && selectedStore && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ Selected: {selectedProduct.name}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Store: {selectedStore.name || selectedStore.walletAddress?.slice(0, 15)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2: Select Recipient */}
              <div>
                <label className="label flex items-center">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">2</span>
                  Select Recipient
                </label>
                <select
                  className="input"
                  value={selectedRecipient?.walletAddress || ''}
                  onChange={(e) => {
                    const recipient = availableRecipients.find(u => u.walletAddress === e.target.value);
                    setSelectedRecipient(recipient);
                  }}
                >
                  <option value="">Choose a recipient...</option>
                  {availableRecipients.map(recipient => (
                    <option key={recipient.walletAddress} value={recipient.walletAddress}>
                      {recipient.name} - {recipient.walletAddress.slice(0, 10)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Select Courier */}
              <div>
                <label className="label flex items-center">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">3</span>
                  Select Courier
                </label>
                <select
                  className="input"
                  value={selectedCourier?.walletAddress || ''}
                  onChange={(e) => {
                    const courier = availableCouriers.find(u => u.walletAddress === e.target.value);
                    setSelectedCourier(courier);
                  }}
                >
                  <option value="">Choose a courier...</option>
                  {availableCouriers.map(courier => (
                    <option key={courier.walletAddress} value={courier.walletAddress}>
                      {courier.name} - {courier.walletAddress.slice(0, 10)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Donation Summary */}
              {selectedProduct && selectedRecipient && selectedCourier && selectedStore && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <FiCheckCircle className="text-green-500 mr-2" />
                    Donation Summary
                  </h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Product:</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-semibold text-primary-600">
                        Rp {Number(selectedProduct.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Store:</span>
                      <span>{selectedStore.name || 'Store'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recipient:</span>
                      <span>{selectedRecipient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Courier:</span>
                      <span>{selectedCourier.name}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateDonation}
                disabled={!selectedProduct || !selectedRecipient || !selectedCourier || creating}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Creating Donation...</span>
                  </>
                ) : (
                  <>
                    <span>Create Donation</span>
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal for Create Donation */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Donation">
        <div className="space-y-4">
          <div>
            <label className="label">Select Product</label>
            <select
              className="input"
              value={selectedProduct?.id || ''}
              onChange={(e) => handleProductSelect(e.target.value)}
            >
              <option value="">Choose a product...</option>
              {availableProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - Rp {Number(product.price).toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Select Recipient</label>
            <select
              className="input"
              value={selectedRecipient?.walletAddress || ''}
              onChange={(e) => {
                const recipient = availableRecipients.find(u => u.walletAddress === e.target.value);
                setSelectedRecipient(recipient);
              }}
            >
              <option value="">Choose a recipient...</option>
              {availableRecipients.map(recipient => (
                <option key={recipient.walletAddress} value={recipient.walletAddress}>
                  {recipient.name} - {recipient.walletAddress.slice(0, 10)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Select Courier</label>
            <select
              className="input"
              value={selectedCourier?.walletAddress || ''}
              onChange={(e) => {
                const courier = availableCouriers.find(u => u.walletAddress === e.target.value);
                setSelectedCourier(courier);
              }}
            >
              <option value="">Choose a courier...</option>
              {availableCouriers.map(courier => (
                <option key={courier.walletAddress} value={courier.walletAddress}>
                  {courier.name} - {courier.walletAddress.slice(0, 10)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateDonation}
            disabled={!selectedProduct || !selectedRecipient || !selectedCourier || creating}
            className="btn-primary w-full"
          >
            {creating ? 'Creating...' : 'Create Donation'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Donations;