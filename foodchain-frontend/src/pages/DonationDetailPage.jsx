import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDonation, storeConfirm, courierPickup, recipientConfirm } from '../services/api';
import DonationSteps from '../components/Donations/DonationSteps';
import { FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DonationDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoNote, setPhotoNote] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      const response = await getDonation(id);
      if (response.success) {
        setDonation(response.data.donation);
      }
    } catch (error) {
      console.error('Failed to fetch donation:', error);
      toast.error('Donation not found');
      navigate('/donations');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreConfirm = async () => {
    if (!photoNote) {
      toast.error('Please add a photo note');
      return;
    }
    setActionLoading(true);
    try {
      await storeConfirm(id, { photoNote });
      toast.success('Donation confirmed! Courier will be notified.');
      fetchDonation();
      setPhotoNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCourierPickup = async () => {
    if (!photoNote) {
      toast.error('Please add a photo note');
      return;
    }
    setActionLoading(true);
    try {
      await courierPickup(id, { photoNote });
      toast.success('Pickup confirmed! Delivering to recipient.');
      fetchDonation();
      setPhotoNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm pickup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecipientConfirm = async () => {
    if (!photoNote) {
      toast.error('Please add a photo note');
      return;
    }
    setActionLoading(true);
    try {
      await recipientConfirm(id, { rating, photoNote });
      toast.success(`Thank you for your feedback! Rating: ${rating}/5`);
      fetchDonation();
      setPhotoNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm');
    } finally {
      setActionLoading(false);
    }
  };

  const getCurrentAction = () => {
    if (!donation || !user) return null;

    const roleActions = {
      STORE: { status: 'CREATED', handler: handleStoreConfirm, buttonText: 'Confirm Packing' },
      COURIER: { status: 'STORE_CONFIRMED', handler: handleCourierPickup, buttonText: 'Confirm Pickup' },
      RECIPIENT: { status: 'IN_DELIVERY', handler: handleRecipientConfirm, buttonText: 'Confirm Receipt' },
    };

    const action = roleActions[user.role];
    if (action && donation.status === action.status) {
      return action;
    }
    return null;
  };

  const currentAction = getCurrentAction();

  if (loading) {
    return <div className="text-center py-12">Loading donation details...</div>;
  }

  if (!donation) {
    return <div className="text-center py-12">Donation not found</div>;
  }

  const statusMap = {
    CREATED: { label: 'Created', color: 'bg-gray-100 text-gray-800' },
    STORE_CONFIRMED: { label: 'Store Confirmed', color: 'bg-blue-100 text-blue-800' },
    IN_DELIVERY: { label: 'In Delivery', color: 'bg-yellow-100 text-yellow-800' },
    DELIVERED: { label: 'Delivered', color: 'bg-purple-100 text-purple-800' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    DISPUTED: { label: 'Disputed', color: 'bg-red-100 text-red-800' },
    REFUNDED: { label: 'Refunded', color: 'bg-orange-100 text-orange-800' },
  };

  const status = statusMap[donation.status] || { label: donation.status, color: 'bg-gray-100' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/donations')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
        <FiArrowLeft />
        <span>Back to Donations</span>
      </button>

      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Donation #{donation.id?.slice(0, 8)}</h1>
            <p className="text-gray-500 text-sm">Created: {new Date(donation.createdAt).toLocaleString('id-ID')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <DonationSteps currentStatus={donation.status} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Donor</p>
            <p className="font-mono text-sm">{donation.donorAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Store</p>
            <p className="font-mono text-sm">{donation.storeAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Recipient</p>
            <p className="font-mono text-sm">{donation.recipientAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Courier</p>
            <p className="font-mono text-sm">{donation.courierAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-primary-600">Rp {Number(donation.totalAmount).toLocaleString('id-ID')}</p>
          </div>
          {donation.recipientRating && (
            <div>
              <p className="text-sm text-gray-500">Recipient Rating</p>
              <p className="text-lg font-semibold text-yellow-500">{'⭐'.repeat(donation.recipientRating)}</p>
            </div>
          )}
        </div>
      </div>

      {currentAction && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Take Action</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Photo Note / Evidence</label>
              <textarea
                className="input"
                rows="3"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="Describe the action you're taking..."
              />
            </div>
            {user?.role === 'RECIPIENT' && (
              <div>
                <label className="label">Rating (1-5)</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRating(r)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rating === r
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {r} ⭐
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={currentAction.handler}
              disabled={actionLoading}
              className="btn-primary w-full"
            >
              {actionLoading ? 'Processing...' : currentAction.buttonText}
            </button>
          </div>
        </div>
      )}

      {donation.status === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">✅ Donation Completed Successfully!</p>
          <p className="text-green-600 text-sm mt-1">Thank you for your contribution to reducing food waste.</p>
        </div>
      )}

      {donation.status === 'DISPUTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">⚠️ This donation is under dispute</p>
          <p className="text-red-600 text-sm mt-1">An admin will review the case and make a decision.</p>
        </div>
      )}
    </div>
  );
};

export default DonationDetailPage;