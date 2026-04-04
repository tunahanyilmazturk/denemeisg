// ==========================================
// Authentication Store with Zustand
// ==========================================
// Manages authentication state, user sessions, and admin user management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AuthState,
  AuthUser,
  LoginCredentials,
  PasswordResetRequest,
  PasswordResetData,
  UserRole,
  SecurityLog,
  SessionStatus,
  ROLE_PERMISSIONS,
  Permission,
} from '../types/auth';
import { tokenManager, generateMockSession, parseTokenPayload } from '../utils/tokenManager';
import toast from 'react-hot-toast';

// ---- Types for Admin User Management ----

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  role: UserRole;
}

export interface UpdateUserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
  isTwoFactorEnabled?: boolean;
}

// Mock users database (in production, this would be API calls)
const INITIAL_MOCK_USERS: (AuthUser & { password: string })[] = [
  {
    id: '1',
    email: 'admin@hantech.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'Kullanıcı',
    role: 'admin',
    phone: '0532 123 45 67',
    department: 'Yönetim',
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    authProvider: 'credentials',
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'uzman@hantech.com',
    password: 'Uzman123!',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    role: 'isg_uzmani',
    phone: '0555 111 22 33',
    department: 'İSG',
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    authProvider: 'credentials',
    lastLoginAt: new Date('2024-06-15').toISOString(),
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'hekim@hantech.com',
    password: 'Hekim123!',
    firstName: 'Zeynep',
    lastName: 'Çelik',
    role: 'isyeri_hekimi',
    phone: '0544 444 55 66',
    department: 'Sağlık',
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    authProvider: 'credentials',
    lastLoginAt: new Date('2024-07-10').toISOString(),
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'mudur@hantech.com',
    password: 'Mudur123!',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    role: 'mudur',
    phone: '0533 987 65 43',
    department: 'Operasyon',
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    authProvider: 'credentials',
    createdAt: new Date('2024-04-10').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let MOCK_USERS = [...INITIAL_MOCK_USERS];

interface AuthStore extends AuthState {
  // Auth Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  checkAuth: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequest) => Promise<void>;
  resetPassword: (data: PasswordResetData) => Promise<void>;
  
  // Permission checks
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  
  // Admin User Management
  systemUsers: AuthUser[];
  loadSystemUsers: () => void;
  createUser: (data: CreateUserData) => Promise<void>;
  updateSystemUser: (data: UpdateUserData) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  
  // Security logs
  securityLogs: SecurityLog[];
  addSecurityLog: (action: SecurityLog['action'], details?: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionStatus: 'expired',
      securityLogs: [],
      systemUsers: [],

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Find user in mock database
          const user = MOCK_USERS.find(u => u.email === credentials.email);
          
          if (!user || user.password !== credentials.password) {
            get().addSecurityLog('login_failed', `Failed login attempt for ${credentials.email}`);
            throw new Error('Email veya şifre hatalı');
          }

          // Generate session
          const session = generateMockSession(user.id, user.role);
          tokenManager.setSession(session);

          // Remove password from user object
          const { password, ...userWithoutPassword } = user;
          
          // Update last login
          userWithoutPassword.lastLoginAt = new Date().toISOString();
          user.lastLoginAt = userWithoutPassword.lastLoginAt;

          set({ 
            user: userWithoutPassword, 
            isAuthenticated: true, 
            sessionStatus: 'active',
            isLoading: false,
            error: null,
          });

          get().addSecurityLog('login_success', `Successful login from ${credentials.email}`);
          toast.success(`Hoş geldiniz, ${user.firstName}!`);
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Giriş başarısız',
            isAuthenticated: false,
            user: null,
          });
          toast.error(error.message || 'Giriş başarısız');
          throw error;
        }
      },

      // Logout action
      logout: () => {
        const { user } = get();
        tokenManager.clearAll();
        set({ 
          user: null, 
          isAuthenticated: false,
          sessionStatus: 'expired',
          error: null,
          systemUsers: [],
        });
        get().addSecurityLog('logout', user?.email);
        toast.success('Çıkış yapıldı');
      },

      // Refresh session
      refreshSession: async () => {
        try {
          const session = tokenManager.getSession();
          if (!session) {
            throw new Error('No session found');
          }

          const newSession = generateMockSession(get().user?.id || '', get().user?.role || 'viewer');
          tokenManager.setSession(newSession);
          
          set({ sessionStatus: 'active' });
        } catch (error) {
          get().logout();
        }
      },

      // Check authentication on app load
      checkAuth: () => {
        const session = tokenManager.getSession();
        const isExpired = tokenManager.isTokenExpired();
        
        if (!session || isExpired) {
          set({ 
            user: null, 
            isAuthenticated: false,
            sessionStatus: 'expired',
          });
          tokenManager.clearAll();
          return;
        }

        const payload = parseTokenPayload(session.accessToken);
        if (!payload) {
          get().logout();
          return;
        }

        const userId = payload.sub as string;
        const user = MOCK_USERS.find(u => u.id === userId);
        
        if (user) {
          const { password, ...userWithoutPassword } = user;
          set({ 
            user: userWithoutPassword, 
            isAuthenticated: true,
            sessionStatus: 'active',
          });
        }
      },

      // Update own profile
      updateUser: (updates: Partial<AuthUser>) => {
        const { user } = get();
        if (!user) return;

        const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
        set({ user: updatedUser });
        
        // Also update in mock DB
        const idx = MOCK_USERS.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updates, updatedAt: new Date().toISOString() };
        }
        
        get().addSecurityLog('profile_update', `User profile updated`);
        toast.success('Profil güncellendi');
      },

      // Change password
      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');

          await new Promise(resolve => setTimeout(resolve, 1000));

          const mockUser = MOCK_USERS.find(u => u.id === user.id);
          if (!mockUser || mockUser.password !== currentPassword) {
            throw new Error('Mevcut şifre hatalı');
          }

          mockUser.password = newPassword;
          
          set({ isLoading: false });
          get().addSecurityLog('password_change', 'Password changed successfully');
          toast.success('Şifre başarıyla değiştirildi');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Şifre değiştirilemedi');
          throw error;
        }
      },

      // Request password reset
      requestPasswordReset: async (data: PasswordResetRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));

          const user = MOCK_USERS.find(u => u.email === data.email);
          if (!user) {
            toast.success('Eğer email adresiniz kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.');
            set({ isLoading: false });
            return;
          }

          get().addSecurityLog('password_reset_request', `Reset requested for ${data.email}`);
          toast.success('Şifre sıfırlama bağlantısı email adresinize gönderildi');
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error('İstek gönderilemedi');
          throw error;
        }
      },

      // Reset password with token
      resetPassword: async (data: PasswordResetData) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (data.newPassword !== data.confirmPassword) {
            throw new Error('Şifreler eşleşmiyor');
          }

          get().addSecurityLog('password_reset_complete', 'Password reset completed');
          toast.success('Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.');
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Şifre sıfırlanamadı');
          throw error;
        }
      },

      // Check if user has specific permission
      hasPermission: (resource: string, action: string): boolean => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return false;

        const permissions = ROLE_PERMISSIONS[user.role] || [];
        
        if (permissions.some(p => p.resource === 'all' && p.actions.includes('manage'))) {
          return true;
        }

        return permissions.some(p => 
          p.resource === resource && 
          (p.actions.includes(action as any) || p.actions.includes('manage'))
        );
      },

      // Check if user has one of the specified roles
      hasRole: (roles: UserRole[]): boolean => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return false;
        return roles.includes(user.role);
      },

      // ==========================================
      // Admin User Management
      // ==========================================

      // Load all system users (admin only)
      loadSystemUsers: () => {
        const users: AuthUser[] = MOCK_USERS.map(({ password, ...u }) => u);
        set({ systemUsers: users });
      },

      // Create new user (admin only)
      createUser: async (data: CreateUserData) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 800));

          // Check if email exists
          const existing = MOCK_USERS.find(u => u.email === data.email);
          if (existing) {
            throw new Error('Bu email adresi zaten kullanılıyor');
          }

          const newUser: AuthUser & { password: string } = {
            id: `user-${Date.now()}`,
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            phone: data.phone,
            department: data.department,
            isEmailVerified: true,
            isTwoFactorEnabled: false,
            authProvider: 'credentials',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          MOCK_USERS.push(newUser);
          
          // Update system users list
          const { password, ...userWithoutPassword } = newUser;
          set((state) => ({ 
            systemUsers: [...state.systemUsers, userWithoutPassword],
            isLoading: false,
          }));

          get().addSecurityLog('profile_update', `Admin created user: ${data.email}`);
          toast.success(`${data.firstName} ${data.lastName} başarıyla eklendi`);
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Kullanıcı oluşturulamadı');
          throw error;
        }
      },

      // Update system user (admin only)
      updateSystemUser: async (data: UpdateUserData) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));

          const idx = MOCK_USERS.findIndex(u => u.id === data.id);
          if (idx === -1) throw new Error('Kullanıcı bulunamadı');

          // Check email uniqueness if changed
          if (data.email && data.email !== MOCK_USERS[idx].email) {
            const emailExists = MOCK_USERS.find(u => u.email === data.email && u.id !== data.id);
            if (emailExists) throw new Error('Bu email adresi zaten kullanılıyor');
          }

          MOCK_USERS[idx] = { 
            ...MOCK_USERS[idx], 
            ...data, 
            updatedAt: new Date().toISOString() 
          };

          const { password, ...userWithoutPassword } = MOCK_USERS[idx];
          set((state) => ({
            systemUsers: state.systemUsers.map(u => u.id === data.id ? userWithoutPassword : u),
            isLoading: false,
          }));

          get().addSecurityLog('profile_update', `Admin updated user: ${MOCK_USERS[idx].email}`);
          toast.success('Kullanıcı bilgileri güncellendi');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Güncelleme başarısız');
          throw error;
        }
      },

      // Delete system user (admin only)
      deleteSystemUser: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));

          const { user } = get();
          if (user?.id === id) throw new Error('Kendi hesabınızı silemezsiniz');

          const targetUser = MOCK_USERS.find(u => u.id === id);
          if (!targetUser) throw new Error('Kullanıcı bulunamadı');

          MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
          
          set((state) => ({
            systemUsers: state.systemUsers.filter(u => u.id !== id),
            isLoading: false,
          }));

          get().addSecurityLog('profile_update', `Admin deleted user: ${targetUser.email}`);
          toast.success(`${targetUser.firstName} ${targetUser.lastName} silindi`);
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Silme başarısız');
          throw error;
        }
      },

      // Reset a user's password (admin only)
      resetUserPassword: async (userId: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));

          const idx = MOCK_USERS.findIndex(u => u.id === userId);
          if (idx === -1) throw new Error('Kullanıcı bulunamadı');

          MOCK_USERS[idx].password = newPassword;
          
          set({ isLoading: false });
          get().addSecurityLog('password_change', `Admin reset password for: ${MOCK_USERS[idx].email}`);
          toast.success(`${MOCK_USERS[idx].firstName} ${MOCK_USERS[idx].lastName} şifresi sıfırlandı`);
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message || 'Şifre sıfırlanamadı');
          throw error;
        }
      },

      // Toggle user active/inactive (admin only)
      toggleUserStatus: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));

          const { user } = get();
          if (user?.id === userId) throw new Error('Kendi hesabınızı devre dışı bırakamazsınız');

          const idx = MOCK_USERS.findIndex(u => u.id === userId);
          if (idx === -1) throw new Error('Kullanıcı bulunamadı');

          const isCurrentlyVerified = MOCK_USERS[idx].isEmailVerified;
          MOCK_USERS[idx].isEmailVerified = !isCurrentlyVerified;
          MOCK_USERS[idx].updatedAt = new Date().toISOString();

          const { password, ...userWithoutPassword } = MOCK_USERS[idx];
          set((state) => ({
            systemUsers: state.systemUsers.map(u => u.id === userId ? userWithoutPassword : u),
            isLoading: false,
          }));

          const action = isCurrentlyVerified ? 'devre dışı bırakıldı' : 'aktif edildi';
          get().addSecurityLog('profile_update', `User ${MOCK_USERS[idx].email} ${action}`);
          toast.success(`Kullanıcı ${action}`);
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          toast.error(error.message);
          throw error;
        }
      },

      // Add security log
      addSecurityLog: (action: SecurityLog['action'], details?: string) => {
        const { user, securityLogs } = get();
        const newLog: SecurityLog = {
          id: `log-${Date.now()}`,
          userId: user?.id || 'anonymous',
          action,
          timestamp: new Date().toISOString(),
          details,
          ipAddress: '127.0.0.1',
        };
        
        const updatedLogs = [newLog, ...securityLogs].slice(0, 100);
        set({ securityLogs: updatedLogs });
      },
    }),
    {
      name: 'hantech-auth-storage-v2',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionStatus: state.sessionStatus,
        securityLogs: state.securityLogs,
      }),
    }
  )
);

// Auto-check authentication on store initialization
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
  
  setInterval(() => {
    const { isAuthenticated, refreshSession, logout } = useAuthStore.getState();
    
    if (!isAuthenticated) return;

    if (tokenManager.isTokenExpired()) {
      logout();
      toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
    } else if (tokenManager.shouldRefreshToken()) {
      refreshSession();
    }
  }, 60000);
}
