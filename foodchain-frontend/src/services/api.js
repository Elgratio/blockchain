import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  const response = await api.get('/users/all');
  return response.data;
};

export const verifyUser = async (address, token) => {
  const response = await api.post(`/users/verify/${address}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Products
export const listProducts = async (params = {}) => {
  const response = await api.get('/stores/products', { params });
  return response.data;
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

export default api;