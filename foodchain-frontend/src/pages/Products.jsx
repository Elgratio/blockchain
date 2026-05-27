import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listProducts, getMyProducts, createProduct } from '../services/api';
import ProductCard from '../components/Products/ProductCard';
import ProductForm from '../components/Products/ProductForm';
import Modal from '../components/Common/Modal';
import { FiPlus } from 'react-icons/fi';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchProducts();
    if (user?.role === 'STORE') {
      fetchMyProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await listProducts();
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const response = await getMyProducts();
      if (response.success) {
        setMyProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch my products:', error);
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      const response = await createProduct(productData);
      if (response.success) {
        setShowModal(false);
        fetchMyProducts();
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  const displayProducts = activeTab === 'available' ? products : myProducts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'STORE' 
              ? 'Manage your products and list new items' 
              : 'Browse available products to donate'}
          </p>
        </div>
        {user?.role === 'STORE' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <FiPlus />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {user?.role === 'STORE' && (
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'available'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Available Products
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'my'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Products
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} userRole={user?.role} />
        ))}
      </div>

      {displayProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {activeTab === 'available' 
              ? 'No products available at the moment.' 
              : 'You haven\'t listed any products yet.'}
          </p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Product">
        <ProductForm onSubmit={handleCreateProduct} onCancel={() => setShowModal(false)} />
      </Modal>
    </div>
  );
};

export default Products;