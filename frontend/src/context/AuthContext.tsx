import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession, LoginPayload, SignupPayload } from '../types/auth';
import { authApi } from '../api/authApi';
import { getStoredToken, clearStoredTokens } from '../api/client';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserSession>) => void;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_SESSION_KEY = 'paysim_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveUserSession = useCallback((u: UserSession | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  }, []);

  const refreshUserSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const sessionUser = await authApi.getCurrentUser();
      saveUserSession(sessionUser);
    } catch {
      // If fetching fails with valid token, keep existing stored user
    } finally {
      setIsLoading(false);
    }
  }, [saveUserSession]);

  useEffect(() => {
    refreshUserSession();
  }, [refreshUserSession]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const auth = await authApi.login(payload);
      saveUserSession(auth.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupPayload) => {
    setIsLoading(true);
    try {
      const auth = await authApi.signup(payload);
      saveUserSession(auth.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearStoredTokens();
      saveUserSession(null);
    }
  };

  const updateUser = (updated: Partial<UserSession>) => {
    if (!user) return;
    const next = { ...user, ...updated };
    saveUserSession(next);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!getStoredToken(),
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        refreshUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
