// ==========================================
// User-Specific Data Filtering Hook
// ==========================================
// Filters data based on user role:
// - Admin and Manager: Can see all data
// - Other users: Can only see their own created data

import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/auth';

// Roles that can see all data
const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin', 'mudur'];

export interface UserDataFilterable {
  createdBy?: string;
}

/**
 * Hook that filters data based on the current user's role
 * @param data - Array of data items with optional createdBy field
 * @returns Filtered data array
 */
export function useUserDataFilter<T extends UserDataFilterable>(data: T[]): T[] {
  const { user } = useAuthStore();

  return useMemo(() => {
    // If no user is authenticated, return empty array
    if (!user) {
      return [];
    }

    // Admin and Manager roles can see all data
    if (ADMIN_ROLES.includes(user.role)) {
      return data;
    }

    // Other users can only see their own data
    return data.filter(item => !item.createdBy || item.createdBy === user.id);
  }, [data, user]);
}

/**
 * Check if the current user can view all data (admin/manager role)
 */
export function useCanViewAll(): boolean {
  const { user } = useAuthStore();
  return user ? ADMIN_ROLES.includes(user.role) : false;
}

/**
 * Check if the current user can edit/delete a specific item
 */
export function useCanEditItem(item: UserDataFilterable): boolean {
  const { user } = useAuthStore();
  
  if (!user) return false;
  
  // Admin and Manager roles can edit all items
  if (ADMIN_ROLES.includes(user.role)) return true;
  
  // Other users can only edit their own items
  return !item.createdBy || item.createdBy === user.id;
}

/**
 * Get the current user ID for creating new records
 */
export function useCurrentUserId(): string | undefined {
  const { user } = useAuthStore();
  return user?.id;
}
