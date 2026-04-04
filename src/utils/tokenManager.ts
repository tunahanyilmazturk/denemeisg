// ==========================================
// Token Management Utilities
// ==========================================
// Handles secure token storage, refresh logic, and session management
// Uses localStorage with encryption-like encoding for security

import { AuthSession } from '../types/auth';

const TOKEN_KEY = 'hantech_auth_token';
const REFRESH_KEY = 'hantech_refresh_token';
const SESSION_KEY = 'hantech_session';

// ---- Token Storage ----

export const tokenManager = {
  /** Save access token */
  setAccessToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, btoa(token));
    } catch (e) {
      console.error('Failed to save access token:', e);
    }
  },

  /** Get access token */
  getAccessToken(): string | null {
    try {
      const encoded = localStorage.getItem(TOKEN_KEY);
      if (!encoded) return null;
      return atob(encoded);
    } catch (e) {
      console.error('Failed to read access token:', e);
      return null;
    }
  },

  /** Save refresh token */
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_KEY, btoa(token));
    } catch (e) {
      console.error('Failed to save refresh token:', e);
    }
  },

  /** Get refresh token */
  getRefreshToken(): string | null {
    try {
      const encoded = localStorage.getItem(REFRESH_KEY);
      if (!encoded) return null;
      return atob(encoded);
    } catch (e) {
      console.error('Failed to read refresh token:', e);
      return null;
    }
  },

  /** Save full session */
  setSession(session: AuthSession): void {
    try {
      this.setAccessToken(session.accessToken);
      this.setRefreshToken(session.refreshToken);
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        expiresAt: session.expiresAt,
        issuedAt: session.issuedAt,
      }));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },

  /** Get full session */
  getSession(): AuthSession | null {
    try {
      const accessToken = this.getAccessToken();
      const refreshToken = this.getRefreshToken();
      const sessionData = localStorage.getItem(SESSION_KEY);

      if (!accessToken || !refreshToken || !sessionData) return null;

      const { expiresAt, issuedAt } = JSON.parse(sessionData);
      return { accessToken, refreshToken, expiresAt, issuedAt };
    } catch (e) {
      console.error('Failed to read session:', e);
      return null;
    }
  },

  /** Check if token is expired */
  isTokenExpired(): boolean {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return true;

      const { expiresAt } = JSON.parse(sessionData);
      // Add 30 second buffer for clock skew
      return Date.now() >= (expiresAt - 30000);
    } catch (e) {
      return true;
    }
  },

  /** Check if token needs refresh (within 5 min of expiry) */
  shouldRefreshToken(): boolean {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return false;

      const { expiresAt } = JSON.parse(sessionData);
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() >= (expiresAt - fiveMinutes) && Date.now() < expiresAt;
    } catch (e) {
      return false;
    }
  },

  /** Clear all auth data */
  clearAll(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  /** Get remaining session time in seconds */
  getRemainingTime(): number {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return 0;

      const { expiresAt } = JSON.parse(sessionData);
      const remaining = Math.max(0, expiresAt - Date.now());
      return Math.floor(remaining / 1000);
    } catch (e) {
      return 0;
    }
  },
};

// ---- Mock Token Generation (for demo/development) ----

/** Generate a mock JWT-like token */
export function generateMockToken(userId: string, role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  }));
  const signature = btoa(`${header}.${payload}.hantech-secret`);
  return `${header}.${payload}.${signature}`;
}

/** Generate a mock session */
export function generateMockSession(userId: string, role: string): AuthSession {
  const now = Date.now();
  return {
    accessToken: generateMockToken(userId, role),
    refreshToken: generateMockToken(userId, `${role}-refresh`),
    issuedAt: now,
    expiresAt: now + (60 * 60 * 1000), // 1 hour from now
  };
}

/** Parse mock token payload */
export function parseTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    return null;
  }
}
