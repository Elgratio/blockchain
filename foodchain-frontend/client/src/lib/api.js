/**
 * FoodChain API Client
 * Handles all communication with the FoodChain backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class FoodChainAPI {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('foodchain_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('foodchain_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('foodchain_token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }

    return data;
  }

  // ── Users ────────────────────────────────────────────────────
  async registerUser(payload) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async loginWithSignature(payload) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async loginDev(walletAddress) {
    return this.request('/users/login-dev', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async getMe() {
    return this.request('/users/me');
  }

  async getAllUsers() {
    return this.request('/users/all');
  }

  async verifyUser(address) {
    return this.request(`/users/verify/${address}`, {
      method: 'POST',
    });
  }

  // ── Stores ───────────────────────────────────────────────────
  async getProducts(storeAddress, page = 1, limit = 10) {
    const params = new URLSearchParams();
    if (storeAddress) params.append('storeAddress', storeAddress);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.request(`/stores/products?${params.toString()}`);
  }

  async getMyProducts() {
    return this.request('/stores/my-products');
  }

  async createProduct(payload) {
    return this.request('/stores/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStoreReputation(address) {
    return this.request(`/stores/reputation/${address}`);
  }

  // ── Donations ────────────────────────────────────────────────
  async createDonation(payload) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDonations(filter = {}) {
    const params = new URLSearchParams();
    if (filter.donorAddress) params.append('donorAddress', filter.donorAddress);
    if (filter.storeAddress) params.append('storeAddress', filter.storeAddress);
    if (filter.recipientAddress) params.append('recipientAddress', filter.recipientAddress);
    if (filter.courierAddress) params.append('courierAddress', filter.courierAddress);
    if (filter.status) params.append('status', filter.status);

    return this.request(`/donations?${params.toString()}`);
  }

  async getDonationById(id) {
    return this.request(`/donations/${id}`);
  }

  async storeConfirmDonation(donationId, packingPhotoHash) {
    return this.request(`/donations/${donationId}/store-confirm`, {
      method: 'POST',
      body: JSON.stringify({ packingPhotoHash }),
    });
  }

  async courierPickupDonation(donationId, pickupPhotoHash) {
    return this.request(`/donations/${donationId}/courier-pickup`, {
      method: 'POST',
      body: JSON.stringify({ pickupPhotoHash }),
    });
  }

  async recipientConfirmDonation(donationId, receivedPhotoHash, rating) {
    return this.request(`/donations/${donationId}/recipient-confirm`, {
      method: 'POST',
      body: JSON.stringify({ receivedPhotoHash, rating }),
    });
  }

  // ── Disputes ─────────────────────────────────────────────────
  async raiseDispute(donationId, evidenceHash) {
    return this.request(`/disputes/${donationId}/raise`, {
      method: 'POST',
      body: JSON.stringify({ evidenceHash }),
    });
  }

  async getDispute(donationId) {
    return this.request(`/disputes/${donationId}`);
  }

  async resolveDispute(donationId, result, resolutionNotes) {
    return this.request(`/disputes/${donationId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ result, resolutionNotes }),
    });
  }
}

export const api = new FoodChainAPI();
