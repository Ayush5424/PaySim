import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { Notification } from '../types/notification';

export const notificationApi = {
  async getNotifications(): Promise<Notification[]> {
    const res = await apiClient<Notification[]>(ENDPOINTS.notification.list);
    return Array.isArray(res) ? res : [];
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient<{ unreadCount: number }>(ENDPOINTS.notification.unreadCount);
    return res?.unreadCount || 0;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient(ENDPOINTS.notification.markRead(id), { method: 'PUT' });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient(ENDPOINTS.notification.markAllRead, { method: 'PUT' });
  },
};
