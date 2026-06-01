import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      hasToken: !!localStorage.getItem('token')
    });
    return Promise.reject(error);
  }
);

// Users
export const register = async (userData) => {
  const response = await api.post('/users/register', userData);
  return response.data;
};

export const login = async (walletAddress, signature, message) => {
  const response = await api.post('/users/login', { walletAddress, signature, message });
  return response.data;
};

export const loginDev = async (walletAddress) => {
  const response = await api.post('/users/login-dev', { walletAddress });
  return response.data;
};

export const getMe = async (token) => {
  const response = await api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('getAllUsers called, token exists:', !!token);
    
    const response = await api.get('/users/all');
    console.log('getAllUsers response:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('getAllUsers error:', error.response?.status, error.response?.data);
    throw error;
  }
};

export const verifyUser = async (address, token) => {
  const response = await api.post(`/users/verify/${address}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Products
export const listProducts = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    console.log('listProducts called, token exists:', !!token);
    
    const response = await api.get('/stores/products', { params });
    console.log('listProducts response:', response.status, response.data?.data?.products?.length);
    return response.data;
  } catch (error) {
    console.error('listProducts error:', error.response?.status, error.response?.data);
    throw error;
  }
};

export const getMyProducts = async () => {
  const response = await api.get('/stores/my-products');
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/stores/products', productData);
  return response.data;
};

export const getStoreReputation = async (address) => {
  const response = await api.get(`/stores/reputation/${address}`);
  return response.data;
};

// Donations
export const createDonation = async (donationData) => {
  const response = await api.post('/donations', donationData);
  return response.data;
};

export const getDonations = async (params = {}) => {
  const response = await api.get('/donations', { params });
  return response.data;
};

export const getDonation = async (id) => {
  const response = await api.get(`/donations/${id}`);
  return response.data;
};

export const storeConfirm = async (id, data) => {
  const response = await api.post(`/donations/${id}/store-confirm`, data);
  return response.data;
};

export const courierPickup = async (id, data) => {
  const response = await api.post(`/donations/${id}/courier-pickup`, data);
  return response.data;
};

export const recipientConfirm = async (id, data) => {
  const response = await api.post(`/donations/${id}/recipient-confirm`, data);
  return response.data;
};

// Disputes
export const raiseDispute = async (data) => {
  const response = await api.post('/disputes', data);
  return response.data;
};

export const respondToDispute = async (donationId, data) => {
  const response = await api.post(`/disputes/${donationId}/respond`, data);
  return response.data;
};

export const resolveDispute = async (donationId, data) => {
  const response = await api.post(`/disputes/${donationId}/resolve`, data);
  return response.data;
};

export const getDispute = async (donationId) => {
  const response = await api.get(`/disputes/${donationId}`);
  return response.data;
};

// Get all recipients (available for all authenticated users)
export const getRecipients = async () => {
  try {
    const response = await api.get('/users/recipients');
    console.log('getRecipients response:', response.data);
    // Return the full response data structure
    return response.data;
  } catch (error) {
    console.error('getRecipients error:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Get all couriers (available for all authenticated users)
export const getCouriers = async () => {
  try {
    const response = await api.get('/users/couriers');
    console.log('getCouriers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getCouriers error:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Get all stores (available for all authenticated users)
export const getStores = async () => {
  try {
    const response = await api.get('/users/stores');
    console.log('getStores response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getStores error:', error.response?.status, error.response?.data);
    throw error;
  }
};

export default api;