import React from 'react';
import { FiCheckCircle, FiPackage, FiTruck, FiHome, FiDollarSign, FiHeart } from 'react-icons/fi';

const DonationSteps = ({ currentStatus }) => {
  const steps = [
    { key: 'CREATED', label: 'Created', icon: FiHeart, description: 'Donation created and funds locked' },
    { key: 'STORE_CONFIRMED', label: 'Store Prep', icon: FiPackage, description: 'Store packed the items' },
    { key: 'IN_DELIVERY', label: 'In Transit', icon: FiTruck, description: 'Courier picked up items' },
    { key: 'DELIVERED', label: 'Delivered', icon: FiHome, description: 'Recipient received items' },
    { key: 'COMPLETED', label: 'Completed', icon: FiDollarSign, description: 'Funds released to store' },
  ];

  const statusOrder = ['CREATED', 'STORE_CONFIRMED', 'IN_DELIVERY', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  const getStepStatus = (stepIndex) => {
    if (currentStatus === 'DISPUTED') {
      if (stepIndex < 3) return 'completed';
      if (stepIndex === 3) return 'current';
      return 'pending';
    }
    if (currentStatus === 'REFUNDED') {
      if (stepIndex < 1) return 'completed';
      return 'pending';
    }
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="py-6">
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-primary-600 transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                    status === 'completed'
                      ? 'bg-primary-600 text-white'
                      : status === 'current'
                      ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <FiCheckCircle />
                  ) : (
                    <step.icon />
                  )}
                </div>
                <p className={`text-xs font-medium mt-2 ${
                  status === 'completed' || status === 'current'
                    ? 'text-primary-600'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[80px] hidden md:block">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DonationSteps;