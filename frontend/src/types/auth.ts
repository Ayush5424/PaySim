export interface UserSession {
  name: string;
  displayName: string;
  phoneNumber: string;
  email: string | null;
  upiId: string;
  profilePhoto?: string | null;
  verified: boolean;
}

export interface AuthSession {
  token: string;
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  user: UserSession;
}

export interface LoginPayload {
  name?: string;
  phoneNumber?: string;
  identifier?: string;
  pin?: string;
  password?: string;
}

export interface SignupPayload {
  name: string;
  phoneNumber: string;
  pin: string;
  password?: string;
  email?: string | null;
  initialBalance?: number;
}

export interface UserProfile {
  id: number;
  name: string;
  displayName?: string;
  profilePhoto?: string | null;
  phoneNumber: string;
  email?: string | null;
  upiId: string;
  status: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
