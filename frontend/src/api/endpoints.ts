/**
 * PaySim API Endpoints configuration
 * In development, requests use relative path or VITE_API_BASE_URL.
 * In production, empty string means same-origin relative requests.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }
  // In development, Vite proxies '/api' to backend
  return '';
};

export const API_BASE = getApiBaseUrl();

export const ENDPOINTS = {
  auth: {
    signup: `${API_BASE}/api/v1/auth/signup`,
    login: `${API_BASE}/api/v1/auth/login`,
    refresh: `${API_BASE}/api/v1/auth/refresh`,
    me: `${API_BASE}/api/v1/auth/me`,
    logout: `${API_BASE}/api/v1/auth/logout`,
    changePassword: `${API_BASE}/api/v1/auth/change-password`,
  },
  user: {
    me: `${API_BASE}/api/v1/users/me`,
    balance: (upiId: string) => `${API_BASE}/api/v1/users/balance/${encodeURIComponent(upiId)}`,
    balanceWithPin: `${API_BASE}/api/v1/users/balance`,
    transactions: (upiId: string) => `${API_BASE}/api/v1/users/transactions/${encodeURIComponent(upiId)}`,
    byPhone: (phone: string) => `${API_BASE}/api/v1/users/phone/${encodeURIComponent(phone)}`,
    updateProfile: (phone: string) => `${API_BASE}/api/v1/users/profile/${encodeURIComponent(phone)}`,
    removePhoto: (phone: string) => `${API_BASE}/api/v1/users/profile/${encodeURIComponent(phone)}/photo`,
    deleteAccount: `${API_BASE}/api/v1/users/account`,
  },
  payment: {
    send: `${API_BASE}/api/v1/payments/send`,
    receipt: (transactionId: string) => `${API_BASE}/api/v1/payments/receipt/${encodeURIComponent(transactionId)}`,
    qr: (upiId: string) => `${API_BASE}/api/v1/payments/qr/${encodeURIComponent(upiId)}`,
    qrPayload: (upiId: string) => `${API_BASE}/api/v1/payments/qr/${encodeURIComponent(upiId)}/payload`,
  },
  transaction: {
    paged: `${API_BASE}/api/v1/transactions`,
    byUpiId: (upiId: string) => `${API_BASE}/api/v1/transactions/${encodeURIComponent(upiId)}`,
  },
  notification: {
    list: `${API_BASE}/api/v1/notifications`,
    unreadCount: `${API_BASE}/api/v1/notifications/unread-count`,
    markRead: (id: number) => `${API_BASE}/api/v1/notifications/${id}/read`,
    markAllRead: `${API_BASE}/api/v1/notifications/read-all`,
  },
};
