/**
 * Custom React Hooks Index
 *
 * Centralized export for all custom hooks used throughout the application.
 * This provides a cleaner import interface:
 *
 * Instead of: import { useAppearance } from '../hooks/useAppearance'
 * Use: import { useAppearance } from '../hooks'
 */

// ==========================================
// UI & Theme Hooks
// ==========================================

export { useAppearance } from './useAppearance';
export { useLocalStorage } from './useLocalStorage';

// ==========================================
// Data Management Hooks
// ==========================================

export {
  useDataTable,
  type SortDirection,
  type SortConfig,
  type UseDataTableProps,
  type UseDataTableReturn
} from './useDataTable';
export { useUserDataFilter, useCanViewAll, useCanEditItem, useCurrentUserId } from './useUserDataFilter';

// ==========================================
// Hooks Summary
// ==========================================

/**
 * useAppearance()
 * Manages application appearance settings (theme, font size, accent color)
 * Returns: { isDarkMode, fontSize, accentColor, ...setters }
 *
 * useDataTable<T>()
 * Manages table state (sorting, filtering, pagination, search)
 * Returns: { sortConfig, searchTerm, filters, currentPage, pageSize, ...handlers }
 *
 * useUserDataFilter<T>(data)
 * Filters data based on user role and permissions
 * Returns: filtered array of items user has access to
 *
 * useCanViewAll()
 * Checks if user can view all data (admin/manager roles)
 * Returns: boolean
 */
