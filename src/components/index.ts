/**
 * Components Index
 *
 * Centralized export for all React components.
 * Provides a clean import interface:
 *
 * import { Button, Modal, ProtectedRoute } from '../components'
 */

// ==========================================
// Auth Components
// ==========================================

export { ProtectedRoute } from './auth/ProtectedRoute';

// ==========================================
// Layout Components
// ==========================================

export { Header } from './layout/Header';
export { Layout } from './layout/Layout';
export { MobileNav } from './layout/MobileNav';
export { PageTransition } from './layout/PageTransition';
export { Sidebar } from './layout/Sidebar';

// ==========================================
// Settings Components
// ==========================================

export { AdvancedDefinitionsTab } from './settings/AdvancedDefinitionsTab';
export { AppearanceSettingsTab } from './settings/AppearanceSettingsTab';
export { NotificationSettingsTab } from './settings/NotificationSettingsTab';

// ==========================================
// UI Components
// ==========================================

// Core UI elements
export { Button, cn } from './ui/Button';
export { DataTable } from './ui/DataTable';
export { FileUpload } from './ui/FileUpload';
export { ImageGallery } from './ui/ImageGallery';
export { Input } from './ui/Input';
export { Modal } from './ui/Modal';
export {
  Skeleton,
  StatCardSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  CardSkeleton,
  PageHeaderSkeleton,
  DetailPageSkeleton,
  DashboardWidgetSkeleton,
  FormSkeleton,
  NotificationListSkeleton,
  ProfileHeaderSkeleton,
} from './ui/Skeleton';

// ==========================================
// Error Components
// ==========================================

export {
  ErrorBoundary,
  withErrorBoundary,
  ChartErrorBoundary,
  PageErrorBoundary,
} from './ErrorBoundary';

// ==========================================
// Component Summary
// ==========================================

/**
 * Core UI Components:
 * - Button: Customizable button with variants
 * - DataTable: Table with sorting, filtering, pagination
 * - FileUpload: File input with validation
 * - ImageGallery: Photo gallery with lightbox
 * - Input: Form input field
 * - Modal: Dialog component
 *
 * Skeleton Components:
 * - Skeleton: Base pulse animation
 * - StatCardSkeleton: For stat cards
 * - TableSkeleton: For table layouts
 * - CardSkeleton: For card layouts
 * - PageHeaderSkeleton: For page headers
 * - DetailPageSkeleton: For detail pages
 * - FormSkeleton: For forms
 * - DashboardWidgetSkeleton: For dashboard widgets
 *
 * Layout Components:
 * - Header: Top navigation bar
 * - Layout: Main layout wrapper
 * - Sidebar: Left navigation panel
 * - MobileNav: Mobile bottom navigation
 * - PageTransition: Page enter/exit animations
 *
 * Auth Components:
 * - ProtectedRoute: Route-level access control
 *
 * Error Handling:
 * - ErrorBoundary: Error boundary wrapper
 * - withErrorBoundary: HOC for wrapping components
 * - ChartErrorBoundary: Compact error UI for widgets
 * - PageErrorBoundary: Full-page error UI
 */
