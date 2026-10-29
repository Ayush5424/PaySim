import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { UserProfile } from '../types/auth';

export const userApi = {
  async getMe(): Promise<UserProfile> {
    return apiClient<UserProfile>(ENDPOINTS.user.me);
  },

  async getBalance(upiId: string): Promise<number> {
    const res = await apiClient<number | { balance: number }>(ENDPOINTS.user.balance(upiId));
    if (typeof res === 'number') return res;
    if (res && typeof res.balance === 'number') return res.balance;
    return 0;
  },

  async getBalanceWithPin(upiId: string, pin: string): Promise<number> {
    const res = await apiClient<number>(ENDPOINTS.user.balanceWithPin, {
      method: 'POST',
      body: JSON.stringify({ upiId, pin }),
    });
    return typeof res === 'number' ? res : 0;
  },

  async getUserByPhone(phoneNumber: string): Promise<UserProfile> {
    return apiClient<UserProfile>(ENDPOINTS.user.byPhone(phoneNumber));
  },

  async updateProfile(phoneNumber: string, data: { displayName?: string; profilePhoto?: string }): Promise<UserProfile> {
    return apiClient<UserProfile>(ENDPOINTS.user.updateProfile(phoneNumber), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async removePhoto(phoneNumber: string): Promise<void> {
    return apiClient(ENDPOINTS.user.removePhoto(phoneNumber), {
      method: 'DELETE',
    });
  },
};
