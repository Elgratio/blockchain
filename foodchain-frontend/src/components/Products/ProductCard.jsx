import React from 'react';
import { FiPackage, FiCalendar, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

const ProductCard = ({ product, userRole }) => {
  const isExpired = new Date(product.expiryDate) < new Date();

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <FiPackage className="text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-800">{product.name}</h3>
        </div>
        {product.isAvailable && !isExpired && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Available
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FiDollarSign className="mr-2" />
          <span>Rp {Number(product.price).toLocaleString('id-ID')}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FiCalendar className="mr-2" />
          <span>Expires: {new Date(product.expiryDate).toLocaleDateString('id-ID')}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FiCheckCircle className="mr-2" />
          <span>Stock: {product.stock} units</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-2">
        <p className="text-xs text-gray-500">Store: {product.storeAddress?.slice(0, 10)}...</p>
      </div>
    </div>
  );
};

export default ProductCard;