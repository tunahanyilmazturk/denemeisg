// ==========================================
// Advanced Authentication Type Definitions
// ==========================================

export type UserRole = 'superadmin' | 'admin' | 'isg_uzmani' | 'isyeri_hekimi' | 'mudur' | 'personel' | 'viewer';

export type AuthProvider = 'credentials' | 'google' | 'microsoft';

export type SessionStatus = 'active' | 'expired' | 'locked' | 'pending_verification';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  authProvider: AuthProvider;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // Stamp / Signature for certificates
  stampImage?: string; // base64 signature/stamp image
  stampTitle?: string; // e.g. "İSG Uzmanı", "İşyeri Hekimi"
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionStatus: SessionStatus;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  department?: string;
  role?: UserRole;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorData {
  code: string;
  userId: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
}

export interface LoginAttempt {
  email: string;
  timestamp: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityLog {
  id: string;
  userId: string;
  action: SecurityAction;
  timestamp: string;
  details?: string;
  ipAddress?: string;
}

export type SecurityAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'profile_update'
  | 'account_locked'
  | 'account_unlocked'
  | 'session_expired';

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    { resource: 'all', actions: ['manage'] },
  ],
  admin: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'companies', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'personnel', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'incidents', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'trainings', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'ppe', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'risks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
  ],
  isg_uzmani: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'companies', actions: ['read'] },
    { resource: 'personnel', actions: ['create', 'read', 'update'] },
    { resource: 'incidents', actions: ['create', 'read', 'update'] },
    { resource: 'trainings', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'ppe', actions: ['create', 'read', 'update'] },
    { resource: 'risks', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
  ],
  isyeri_hekimi: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'companies', actions: ['read'] },
    { resource: 'personnel', actions: ['read', 'update'] },
    { resource: 'incidents', actions: ['read', 'update'] },
    { resource: 'trainings', actions: ['read'] },
    { resource: 'ppe', actions: ['read'] },
    { resource: 'risks', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
  ],
  mudur: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'companies', actions: ['read'] },
    { resource: 'personnel', actions: ['read'] },
    { resource: 'incidents', actions: ['read'] },
    { resource: 'trainings', actions: ['read'] },
    { resource: 'ppe', actions: ['read'] },
    { resource: 'risks', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
  personel: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'incidents', actions: ['create', 'read'] },
    { resource: 'trainings', actions: ['read'] },
    { resource: 'ppe', actions: ['read'] },
  ],
  viewer: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'companies', actions: ['read'] },
    { resource: 'personnel', actions: ['read'] },
    { resource: 'incidents', actions: ['read'] },
    { resource: 'trainings', actions: ['read'] },
    { resource: 'ppe', actions: ['read'] },
    { resource: 'risks', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Süper Yönetici',
  admin: 'Yönetici',
  isg_uzmani: 'İSG Uzmanı',
  isyeri_hekimi: 'İşyeri Hekimi',
  mudur: 'Müdür',
  personel: 'Personel',
  viewer: 'Gözlemci',
};
