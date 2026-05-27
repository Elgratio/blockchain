import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDonations, raiseDispute, respondToDispute, resolveDispute, getDispute } from '../services/api';
import { FiAlertCircle, FiCheckCircle, FiClock, FiUser, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Disputes = () => {
  const { user, token } = useAuth();
  const [disputedDonations, setDisputedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [responseNote, setResponseNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionResult, setResolutionResult] = useState('STORE_WIN');
  const [disputeDetails, setDisputeDetails] = useState({});

  useEffect(() => {
    fetchDisputedDonations();
  }, [user]);

  const fetchDisputedDonations = async () => {
    try {
      const response = await getDonations({ status: 'DISPUTED' });
      if (response.success) {
        const donations = response.data.donations || [];
        setDisputedDonations(donations);
        
        // Fetch dispute details for each donation
        for (const donation of donations) {
          try {
            const disputeResp = await getDispute(donation.id);
            if (disputeResp.success) {
              setDisputeDetails(prev => ({ ...prev, [donation.id]: disputeResp.data.dispute }));
            }
          } catch (error) {
            console.error('Failed to fetch dispute:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch disputed donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (donationId) => {
    if (!responseNote) {
      toast.error('Please provide a response');
      return;
    }
    try {
      await respondToDispute(donationId, { responseNote });
      toast.success('Response submitted successfully');
      setSelectedDonation(null);
      setResponseNote('');
      fetchDisputedDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    }
  };

  const handleResolve = async (donationId) => {
    try {
      await resolveDispute(donationId, { result: resolutionResult, resolutionNotes: resolutionNote });
      toast.success(`Dispute resolved: ${resolutionResult === 'STORE_WIN' ? 'Store Wins' : 'Donor Wins'}`);
      setSelectedDonation(null);
      setResolutionNote('');
      fetchDisputedDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading disputes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Disputes</h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'ADMIN' 
            ? 'Review and resolve disputes between recipients and stores'
            : user?.role === 'STORE'
            ? 'Respond to disputes raised against your store'
            : 'Track your dispute cases'}
        </p>
      </div>

      {disputedDonations.length === 0 ? (
        <div className="card text-center py-12">
          <FiCheckCircle className="text-5xl text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">No active disputes at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputedDonations.map((donation) => {
            const dispute = disputeDetails[donation.id];
            const canRespond = user?.role === 'STORE' && donation.storeAddress === user.walletAddress;
            const canResolve = user?.role === 'ADMIN';
            
            return (
              <div key={donation.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FiAlertCircle className="text-red-500" />
                      <h3 className="font-semibold text-gray-800">
                        Donation #{donation.id?.slice(0, 8)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      Raised on: {new Date(dispute?.raisedAt || donation.updatedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    DISPUTED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Donor</p>
                    <p className="text-sm font-mono">{donation.donorAddress?.slice(0, 15)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Store</p>
                    <p className="text-sm font-mono">{donation.storeAddress?.slice(0, 15)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Recipient</p>
                    <p className="text-sm font-mono">{donation.recipientAddress?.slice(0, 15)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-semibold text-primary-600">
                      Rp {Number(donation.totalAmount).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {dispute && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Evidence from recipient:</p>
                    <p className="text-sm text-gray-700">{dispute.evidenceHash?.slice(0, 50)}...</p>
                  </div>
                )}

                {selectedDonation === donation.id ? (
                  <div className="space-y-3 mt-4 pt-3 border-t border-gray-100">
                    {canRespond && (
                      <>
                        <textarea
                          className="input"
                          rows="3"
                          value={responseNote}
                          onChange={(e) => setResponseNote(e.target.value)}
                          placeholder="Provide your response with evidence..."
                        />
                        <div className="flex space-x-2">
                          <button onClick={() => handleRespond(donation.id)} className="btn-primary flex-1">
                            Submit Response
                          </button>
                          <button onClick={() => setSelectedDonation(null)} className="btn-outline">
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                    {canResolve && (
                      <>
                        <div>
                          <label className="label">Resolution Result</label>
                          <select
                            className="input"
                            value={resolutionResult}
                            onChange={(e) => setResolutionResult(e.target.value)}
                          >
                            <option value="STORE_WIN">Store Wins</option>
                            <option value="DONOR_WIN">Donor Wins (Refund)</option>
                          </select>
                        </div>
                        <textarea
                          className="input"
                          rows="3"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Resolution notes..."
                        />
                        <div className="flex space-x-2">
                          <button onClick={() => handleResolve(donation.id)} className="btn-primary flex-1">
                            Resolve Dispute
                          </button>
                          <button onClick={() => setSelectedDonation(null)} className="btn-outline">
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  (canRespond || canResolve) && (
                    <button
                      onClick={() => setSelectedDonation(donation.id)}
                      className="btn-outline w-full mt-3"
                    >
                      {canRespond ? 'Respond to Dispute' : 'Resolve Dispute'}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Disputes;