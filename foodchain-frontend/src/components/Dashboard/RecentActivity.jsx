import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiCheckCircle, FiClock, FiTruck } from 'react-icons/fi';

const RecentActivity = ({ donations }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <FiCheckCircle className="text-green-500" />;
      case 'CREATED':
        return <FiHeart className="text-primary-500" />;
      case 'IN_DELIVERY':
        return <FiTruck className="text-yellow-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      CREATED: 'Created',
      STORE_CONFIRMED: 'Store Confirmed',
      IN_DELIVERY: 'In Delivery',
      DELIVERED: 'Delivered',
      COMPLETED: 'Completed',
      DISPUTED: 'Disputed',
      REFUNDED: 'Refunded',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {donations.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No recent donations</p>
        ) : (
          donations.map((donation) => (
            <Link
              key={donation.id}
              to={`/donations/${donation.id}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(donation.status)}
                <div>
                  <p className="font-medium text-gray-800">
                    Donation #{donation.id?.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(donation.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-600">
                  Rp {Number(donation.totalAmount).toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500">{getStatusText(donation.status)}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;