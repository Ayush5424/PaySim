import { ENDPOINTS } from './endpoints';

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const TOKEN_KEY = 'paysim_token';
const REFRESH_TOKEN_KEY = 'paysim_refresh_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken?: string | null): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(ENDPOINTS.auth.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const newAccessToken = data.accessToken || data.token;
    if (newAccessToken) {
      setStoredTokens(newAccessToken, data.refreshToken || refreshToken);
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiClient<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { idempotencyKey, skipAuth, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(`Network error: ${message}. Is the server reachable?`, 0);
  }

  // Handle 401 Unauthorized with token refresh
  if (response.status === 401 && !skipAuth && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...restOptions,
          headers,
        });
        return handleResponse<T>(retryResponse);
      } else {
        clearStoredTokens();
        // Redirect to login if on protected page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
          window.location.href = '/login?expired=true';
        }
        throw new ApiError('Session expired. Please log in again.', 401);
      }
    } else {
      // Wait for ongoing refresh
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryResponse = await fetch(url, {
              ...restOptions,
              headers,
            });
            resolve(await handleResponse<T>(retryResponse));
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let body: unknown;
  if (isJson) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    let errorMessage = 'Request failed';
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      errorMessage = (b.message as string) || (b.error as string) || (b.status as string) || `HTTP error ${response.status}`;
    } else if (typeof body === 'string' && body.length > 0) {
      errorMessage = body;
    }
    throw new ApiError(errorMessage, response.status, body);
  }

  // If response has { status: 'FAILED', message: ... }
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (b.status === 'FAILED') {
      throw new ApiError((b.message as string) || 'Operation failed', response.status, body);
    }
    // If wrapped in standard ApiResponse { status: 'SUCCESS', message: '...', data: ... }
    if ('data' in b && ('status' in b || 'message' in b)) {
      return b.data as T;
    }
  }

  return body as T;
}
