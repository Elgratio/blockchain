import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiCheckCircle, FiClock, FiTruck, FiAlertCircle } from 'react-icons/fi';

const DonationList = ({ donations, userRole }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <FiCheckCircle className="text-green-500" />;
      case 'CREATED':
        return <FiHeart className="text-primary-500" />;
      case 'IN_DELIVERY':
        return <FiTruck className="text-yellow-500" />;
      case 'DISPUTED':
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      CREATED: 'bg-gray-100 text-gray-800',
      STORE_CONFIRMED: 'bg-blue-100 text-blue-800',
      IN_DELIVERY: 'bg-yellow-100 text-yellow-800',
      DELIVERED: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DISPUTED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (donations.length === 0) {
    return (
      <div className="card text-center py-12">
        <FiHeart className="text-5xl text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No donations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donations.map((donation) => (
        <Link
          key={donation.id}
          to={`/donations/${donation.id}`}
          className="card block hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon(donation.status)}
              <div>
                <p className="font-semibold text-gray-800">
                  Donation #{donation.id?.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(donation.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(donation.status)}`}>
              {donation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-semibold text-primary-600">
                Rp {Number(donation.totalAmount).toLocaleString('id-ID')}
              </p>
            </div>
            {userRole === 'ADMIN' && (
              <>
                <div>
                  <p className="text-xs text-gray-500">Donor</p>
                  <p className="font-mono text-xs">{donation.donorAddress?.slice(0, 10)}...</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="font-mono text-xs">{donation.recipientAddress?.slice(0, 10)}...</p>
                </div>
              </>
            )}
            {donation.recipientRating && (
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-yellow-500">{'⭐'.repeat(donation.recipientRating)}</p>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default DonationList;