/**
 * FoodChain API Client
 * Handles all communication with the FoodChain backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

interface User {
  id: string;
  walletAddress: string;
  role: 'DONOR' | 'STORE' | 'RECIPIENT' | 'COURIER' | 'ADMIN';
  name: string;
  email: string | null;
  phone: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  onChainId: number;
  storeAddress: string;
  name: string;
  price: string;
  imageHash: string;
  certificationHash: string;
  expiryDate: string;
  isAvailable: boolean;
  stock: number;
  createdAt: string;
}

interface Donation {
  id: string;
  onChainId: number;
  donorAddress: string;
  storeAddress: string;
  recipientAddress: string;
  courierAddress: string;
  productIds: number[];
  amount: string;
  status: 'CREATED' | 'STORE_CONFIRMED' | 'IN_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'REFUNDED';
  packingPhotoHash: string;
  pickupPhotoHash: string;
  receivedPhotoHash: string;
  recipientRating: number;
  createdAt: string;
  updatedAt: string;
}

interface Dispute {
  donationId: string;
  raisedBy: string;
  evidenceHash: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

class FoodChainAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('foodchain_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('foodchain_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('foodchain_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
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
  async registerUser(payload: {
    walletAddress: string;
    role: string;
    name: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User; txHash: string; ipfsUrl: string }>> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async loginWithSignature(payload: {
    walletAddress: string;
    signature: string;
    message: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async loginDev(walletAddress: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/users/login-dev', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request('/users/me');
  }

  async getAllUsers(): Promise<ApiResponse<{ users: User[]; total: number }>> {
    return this.request('/users/all');
  }

  async verifyUser(address: string): Promise<ApiResponse<{ address: string; txHash: string }>> {
    return this.request(`/users/verify/${address}`, {
      method: 'POST',
    });
  }

  // ── Stores ───────────────────────────────────────────────────
  async getProducts(storeAddress?: string, page = 1, limit = 10): Promise<
    ApiResponse<{
      products: Product[];
      pagination: { page: number; limit: number; total: number };
    }>
  > {
    const params = new URLSearchParams();
    if (storeAddress) params.append('storeAddress', storeAddress);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.request(`/stores/products?${params.toString()}`);
  }

  async getMyProducts(): Promise<ApiResponse<{ products: Product[]; total: number }>> {
    return this.request('/stores/my-products');
  }

  async createProduct(payload: {
    name: string;
    price: string;
    expiryDate: string;
    stock: number;
    certificationNumber?: string;
  }): Promise<ApiResponse<{ product: Product; txHash: string; imageUrl: string }>> {
    return this.request('/stores/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getStoreReputation(address: string): Promise<
    ApiResponse<{
      storeAddress: string;
      reputation: {
        reputationScore: number;
        totalOrders: number;
        successfulOrders: number;
        totalDisputes: number;
        disputesLost: number;
        isSuspended: boolean;
      };
    }>
  > {
    return this.request(`/stores/reputation/${address}`);
  }

  // ── Donations ────────────────────────────────────────────────
  async createDonation(payload: {
    storeAddress: string;
    recipientAddress: string;
    courierAddress: string;
    productIds: number[];
    amount: string;
  }): Promise<ApiResponse<{ donation: Donation; txHash: string }>> {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDonations(filter?: {
    donorAddress?: string;
    storeAddress?: string;
    recipientAddress?: string;
    courierAddress?: string;
    status?: string;
  }): Promise<ApiResponse<{ donations: Donation[]; total: number }>> {
    const params = new URLSearchParams();
    if (filter?.donorAddress) params.append('donorAddress', filter.donorAddress);
    if (filter?.storeAddress) params.append('storeAddress', filter.storeAddress);
    if (filter?.recipientAddress) params.append('recipientAddress', filter.recipientAddress);
    if (filter?.courierAddress) params.append('courierAddress', filter.courierAddress);
    if (filter?.status) params.append('status', filter.status);

    return this.request(`/donations?${params.toString()}`);
  }

  async getDonationById(id: string): Promise<ApiResponse<Donation>> {
    return this.request(`/donations/${id}`);
  }

  async storeConfirmDonation(donationId: string, packingPhotoHash: string): Promise<
    ApiResponse<{
      donation: Donation;
      txHash: string;
    }>
  > {
    return this.request(`/donations/${donationId}/store-confirm`, {
      method: 'POST',
      body: JSON.stringify({ packingPhotoHash }),
    });
  }

  async courierPickupDonation(donationId: string, pickupPhotoHash: string): Promise<
    ApiResponse<{
      donation: Donation;
      txHash: string;
    }>
  > {
    return this.request(`/donations/${donationId}/courier-pickup`, {
      method: 'POST',
      body: JSON.stringify({ pickupPhotoHash }),
    });
  }

  async recipientConfirmDonation(
    donationId: string,
    receivedPhotoHash: string,
    rating: number
  ): Promise<
    ApiResponse<{
      donation: Donation;
      txHash: string;
    }>
  > {
    return this.request(`/donations/${donationId}/recipient-confirm`, {
      method: 'POST',
      body: JSON.stringify({ receivedPhotoHash, rating }),
    });
  }

  // ── Disputes ─────────────────────────────────────────────────
  async raiseDispute(donationId: string, evidenceHash: string): Promise<
    ApiResponse<{
      dispute: Dispute;
      txHash: string;
    }>
  > {
    return this.request(`/disputes/${donationId}/raise`, {
      method: 'POST',
      body: JSON.stringify({ evidenceHash }),
    });
  }

  async getDispute(donationId: string): Promise<ApiResponse<Dispute>> {
    return this.request(`/disputes/${donationId}`);
  }

  async resolveDispute(
    donationId: string,
    result: 'STORE_WIN' | 'DONOR_WIN',
    resolutionNotes: string
  ): Promise<
    ApiResponse<{
      dispute: Dispute;
      txHash: string;
    }>
  > {
    return this.request(`/disputes/${donationId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ result, resolutionNotes }),
    });
  }
}

export const api = new FoodChainAPI();
export type { User, Product, Donation, Dispute, ApiResponse };
