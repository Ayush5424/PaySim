import { apiClient, setStoredTokens, clearStoredTokens } from './client';
import { ENDPOINTS } from './endpoints';
import { LoginPayload, SignupPayload, AuthSession, UserSession } from '../types/auth';

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const raw = await apiClient<Record<string, unknown>>(ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    const token = (raw.token || raw.accessToken) as string;
    const refreshToken = (raw.refreshToken as string) || undefined;
    const user = (raw.user as UserSession) || {
      name: (raw.name as string) || 'User',
      displayName: (raw.displayName as string) || (raw.name as string) || 'User',
      phoneNumber: (raw.phoneNumber as string) || '',
      email: (raw.email as string) || null,
      upiId: (raw.upiId as string) || '',
      profilePhoto: (raw.profilePhoto as string) || null,
      verified: true,
    };

    setStoredTokens(token, refreshToken);
    return {
      token,
      accessToken: token,
      refreshToken,
      user,
    };
  },

  async signup(payload: SignupPayload): Promise<AuthSession> {
    const raw = await apiClient<Record<string, unknown>>(ENDPOINTS.auth.signup, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    const token = (raw.token || raw.accessToken) as string;
    const refreshToken = (raw.refreshToken as string) || undefined;
    const user = (raw.user as UserSession) || {
      name: payload.name,
      displayName: payload.name,
      phoneNumber: payload.phoneNumber,
      email: payload.email || null,
      upiId: (raw.upiId as string) || `${payload.phoneNumber}@paysim`,
      verified: true,
    };

    setStoredTokens(token, refreshToken);
    return {
      token,
      accessToken: token,
      refreshToken,
      user,
    };
  },

  async getCurrentUser(): Promise<UserSession> {
    return apiClient<UserSession>(ENDPOINTS.auth.me);
  },

  async logout(): Promise<void> {
    try {
      await apiClient(ENDPOINTS.auth.logout, { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearStoredTokens();
    }
  },
};
