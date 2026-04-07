/**
 * Lazy Loading & Code Splitting Utilities
 *
 * Provides utilities for lazy loading page-level components and routes with:
 * - Suspense wrapper at the router level
 * - Preloading on hover/visibility
 * - Code split point references
 */

import React, { lazy } from 'react';

// ==========================================
// Lazy Page Loaders
// ==========================================

/**
 * Pre-built lazy loaders for all page-level components.
 * Use these in React Router route definitions with a top-level <Suspense> wrapper.
 *
 * @example
 * // In App.tsx:
 * import { pages } from './utils/lazy';
 * // ...
 * <Suspense fallback={<LoadingScreen />}>
 *   <Routes>
 *     <Route path="/" element={<pages.Dashboard />} />
 *   </Routes>
 * </Suspense>
 */
export const pages = {
  Dashboard: lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard }))),
  Companies: lazy(() => import('../pages/Companies').then(m => ({ default: m.Companies }))),
  CompanyDetail: lazy(() => import('../pages/CompanyDetail').then(m => ({ default: m.CompanyDetail }))),
  NewCompanyWizard: lazy(() => import('../pages/NewCompanyWizard').then(m => ({ default: m.NewCompanyWizard }))),
  Personnel: lazy(() => import('../pages/Personnel').then(m => ({ default: m.PersonnelPage }))),
  PersonnelDetail: lazy(() => import('../pages/PersonnelDetail').then(m => ({ default: m.PersonnelDetail }))),
  NewPersonnelWizard: lazy(() => import('../pages/NewPersonnelWizard').then(m => ({ default: m.NewPersonnelWizard }))),
  Incidents: lazy(() => import('../pages/Incidents').then(m => ({ default: m.Incidents }))),
  IncidentDetail: lazy(() => import('../pages/IncidentDetail').then(m => ({ default: m.IncidentDetail }))),
  NewIncidentWizard: lazy(() => import('../pages/NewIncidentWizard').then(m => ({ default: m.NewIncidentWizard }))),
  Trainings: lazy(() => import('../pages/Trainings').then(m => ({ default: m.Trainings }))),
  NewTrainingWizard: lazy(() => import('../pages/NewTrainingWizard').then(m => ({ default: m.NewTrainingWizard }))),
  Certificates: lazy(() => import('../pages/Certificates').then(m => ({ default: m.Certificates }))),
  NewCertificateWizard: lazy(() => import('../pages/NewCertificateWizard').then(m => ({ default: m.NewCertificateWizard }))),
  Risks: lazy(() => import('../pages/Risks').then(m => ({ default: m.RisksPage }))),
  PPE: lazy(() => import('../pages/PPE').then(m => ({ default: m.PPEPage }))),
  Reports: lazy(() => import('../pages/Reports').then(m => ({ default: m.Reports }))),
  Settings: lazy(() => import('../pages/Settings').then(m => ({ default: m.Settings }))),
  Profile: lazy(() => import('../pages/Profile').then(m => ({ default: m.ProfilePage }))),
  Login: lazy(() => import('../pages/Login').then(m => ({ default: m.LoginPage }))),
  ForgotPassword: lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPasswordPage }))),
};

// ==========================================
// Resource Preloading
// ==========================================

/**
 * Eagerly imports a page module to warm the browser cache.
 * Useful for preloading likely-next routes on hover/interaction.
 *
 * @example
 * <Link onMouseEnter={() => preload(() => import('../pages/Incidents'))}>
 *   Kaza ve Olaylar
 * </Link>
 */
export const preload = (importFn: () => Promise<{ default: React.ComponentType<unknown> }>): void => {
  void importFn();
};

/**
 * Preload multiple routes at once.
 */
export const preloadAll = (importFns: Array<() => Promise<{ default: React.ComponentType<unknown> }>>): void => {
  importFns.forEach(fn => preload(fn));
};

/**
 * Preloads critical routes early to improve perceived performance.
 * Call this once the app shell has loaded.
 */
export const preloadCriticalRoutes = (): void => {
  void import('../pages/Dashboard');
  void import('../pages/Incidents');
  void import('../pages/Companies');
  void import('../pages/Trainings');
};

// ==========================================
// Code Split Point References
// ==========================================

/**
 * Deferred imports for heavy third-party libraries.
 * These are not imported at startup — only when explicitly called.
 *
 * @example
 * // Only load PDF libs when needed
 * const { jsPDF } = await codeSplits.pdf();
 */
export const codeSplits = {
  /** Recharts (charts) — ~180KB */
  charts: () => import('recharts'),

  /** jsPDF + autotable (PDF generation) — ~95KB */
  pdf: () =>
    Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]),

  /** SheetJS (Excel export) — ~250KB */
  excel: () => import('xlsx'),
};

// ==========================================
// Estimated Bundle Sizes (for monitoring)
// ==========================================

/**
 * Approximate gzipped sizes for major chunks in the production build.
 * Update after running `npm run build` + `npx vite-bundle-analyzer`.
 */
export const bundleEstimates: Record<string, string> = {
  'react-vendor': '45 KB',
  'router-vendor': '12 KB',
  'charts-vendor': '180 KB',
  'motion-vendor': '35 KB',
  'pdf-vendor': '95 KB',
  'xlsx-vendor': '250 KB',
  'toast-vendor': '5 KB',
  'zustand-vendor': '3 KB',
  'utils-vendor': '8 KB',
};
