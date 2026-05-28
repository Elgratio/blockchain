import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listProducts, getAllUsers, createDonation, getDonations } from '../../services/api';
import { FiPackage, FiUser, FiDollarSign, FiCheckCircle, FiArrowRight, FiClock, FiTruck, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DonationDemo = () => {
  const { user, balance, refreshBalance } = useAuth();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [donation, setDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);

  useEffect(() => {
    fetchData();
    fetchDonations();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        listProducts(),
        getAllUsers()
      ]);
      
      if (productsRes.success) {
        setProducts(productsRes.data.products || []);
      }
      
      if (usersRes.success) {
        const allUsers = usersRes.data.users || [];
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await getDonations();
      if (response.success) {
        setDonations(response.data.donations || []);
      }
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    }
  };

  const handleCreateDonation = async () => {
    if (!selectedProduct || !selectedRecipient || !selectedStore || !selectedCourier) {
      toast.error('Please complete all selections');
      return;
    }

    setLoading(true);
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
        setDonation(response.data.donation);
        setStep(2);
        toast.success('Donation created successfully!');
        fetchDonations();
        refreshBalance();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Demo Donation Flow</h3>
        <p className="text-sm text-blue-600">
          Follow the steps to create a complete donation from donor to recipient.
        </p>
      </div>

      {/* Step 1: Select Product */}
      <div>
        <label className="label flex items-center">
          <FiPackage className="mr-2" />
          1. Select Product to Donate
        </label>
        <select
          className="input"
          value={selectedProduct?.id || ''}
          onChange={(e) => {
            const product = products.find(p => p.id === e.target.value);
            setSelectedProduct(product);
            // Auto-select store from product
            const store = users.find(u => u.walletAddress === product?.storeAddress);
            setSelectedStore(store);
          }}
        >
          <option value="">Choose a product...</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - Rp {Number(product.price).toLocaleString('id-ID')} 
              ({product.storeAddress?.slice(0, 10)}...)
            </option>
          ))}
        </select>
        {selectedProduct && (
          <div className="mt-2 text-sm text-green-600">
            ✓ Product selected: {selectedProduct.name}
          </div>
        )}
      </div>

      {/* Step 2: Select Recipient */}
      <div>
        <label className="label flex items-center">
          <FiUser className="mr-2" />
          2. Select Recipient
        </label>
        <select
          className="input"
          value={selectedRecipient?.walletAddress || ''}
          onChange={(e) => {
            const recipient = users.find(u => u.walletAddress === e.target.value);
            setSelectedRecipient(recipient);
          }}
        >
          <option value="">Choose a recipient...</option>
          {users.filter(u => u.role === 'RECIPIENT' && u.isVerified).map(recipient => (
            <option key={recipient.walletAddress} value={recipient.walletAddress}>
              {recipient.name} - {recipient.walletAddress.slice(0, 10)}...
            </option>
          ))}
        </select>
      </div>

      {/* Step 3: Select Courier (Auto-select if available) */}
      <div>
        <label className="label flex items-center">
          <FiTruck className="mr-2" />
          3. Select Courier
        </label>
        <select
          className="input"
          value={selectedCourier?.walletAddress || ''}
          onChange={(e) => {
            const courier = users.find(u => u.walletAddress === e.target.value);
            setSelectedCourier(courier);
          }}
        >
          <option value="">Choose a courier...</option>
          {users.filter(u => u.role === 'COURIER' && u.isVerified).map(courier => (
            <option key={courier.walletAddress} value={courier.walletAddress}>
              {courier.name} - {courier.walletAddress.slice(0, 10)}...
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {selectedProduct && selectedRecipient && selectedCourier && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-800">Donation Summary</h4>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Product:</span> {selectedProduct.name}</p>
            <p><span className="text-gray-500">Amount:</span> Rp {Number(selectedProduct.price).toLocaleString('id-ID')}</p>
            <p><span className="text-gray-500">Store:</span> {selectedStore?.name} ({selectedStore?.walletAddress?.slice(0, 10)}...)</p>
            <p><span className="text-gray-500">Recipient:</span> {selectedRecipient.name}</p>
            <p><span className="text-gray-500">Courier:</span> {selectedCourier.name}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleCreateDonation}
        disabled={!selectedProduct || !selectedRecipient || !selectedCourier || loading}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {loading ? (
          <span>Creating Donation...</span>
        ) : (
          <>
            <span>Create Donation</span>
            <FiArrowRight />
          </>
        )}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <FiCheckCircle className="text-green-600" />
          <h3 className="font-semibold text-green-800">Donation Created Successfully!</h3>
        </div>
        <p className="text-sm text-green-600">
          Funds have been locked in the smart contract escrow. The store will now prepare your donation.
        </p>
      </div>

      {donation && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Donation Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Donation ID:</span>
              <span className="font-mono">{donation.id?.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="text-yellow-600 font-medium">{donation.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Locked:</span>
              <span className="text-primary-600 font-semibold">
                Rp {Number(donation.totalAmount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span>{new Date(donation.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">Next Steps:</h4>
        <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
          <li>Store will confirm and pack the items</li>
          <li>Courier will pick up the items</li>
          <li>Recipient will confirm receipt and rate the donation</li>
          <li>Funds will be released to the store</li>
        </ol>
      </div>

      <button
        onClick={() => {
          setStep(1);
          setSelectedProduct(null);
          setSelectedRecipient(null);
          setSelectedCourier(null);
          setDonation(null);
        }}
        className="btn-outline w-full"
      >
        Create Another Donation
      </button>
    </div>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <FiCheckCircle className="text-green-500" />;
      case 'CREATED':
        return <FiClock className="text-yellow-500" />;
      case 'IN_DELIVERY':
        return <FiTruck className="text-blue-500" />;
      default:
        return <FiPackage className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-primary-100 text-sm">Your Wallet Balance</p>
            <p className="text-3xl font-bold mt-1">
              {balance ? `${parseFloat(balance).toFixed(4)} MATIC` : '0 MATIC'}
            </p>
            <p className="text-primary-100 text-xs mt-1">
              {user?.walletAddress?.slice(0, 15)}...{user?.walletAddress?.slice(-4)}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <FiDollarSign className="text-2xl" />
          </div>
        </div>
      </div>

      {/* Demo Donation Section */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <FiPackage className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Demo Donation</h2>
        </div>

        {/* Progress Steps */}
        <div className="flex mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 text-center pb-2 border-b-2 ${
                step >= s
                  ? 'border-primary-600 text-primary-600'
                  : 'border-gray-200 text-gray-400'
              }`}
            >
              Step {s}: {s === 1 ? 'Create Donation' : 'Confirmation'}
            </div>
          ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>

      {/* Recent Donations */}
      {donations.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Donations</h3>
          <div className="space-y-3">
            {donations.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(d.status)}
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      Donation #{d.id?.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString()}
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