/**
 * Utils Index
 *
 * Centralized export for all utility modules.
 * Provides a clean import interface:
 *
 * import { formatDateTR, generateId, api, validateField } from '../utils'
 */

// ==========================================
// General Helpers
// ==========================================

export {
  // ID Generation
  generateId,
  generateRecordNo,

  // Date & Time
  formatDateTR,
  formatDateLongTR,
  formatDateTimeTR,
  formatDateTimeLongTR,
  toDatetimeLocalString,
  toDateInputString,
  isExpired,
  daysUntil,
  getLastNMonths,

  // Safety Score
  calculateSafetyScore,
  getSafetyScoreColor,
  getSafetyScoreGradient,
  getSafetyScoreLabel,
  type SafetyScoreInput,

  // Colors
  getSeverityClasses,
  getSeverityDotColor,
  getIncidentStatusClasses,
  getTrainingStatusClasses,

  // Risk Score
  getRiskLevelLabel,
  getRiskScoreClasses,

  // Strings
  truncate,
  toTitleCase,
  getInitials,
  getFullName,
  normalizeTurkish,
  matchesSearch,

  // Numbers
  formatPercentage,
  calculatePercentage,

  // Files
  formatFileSize,
  isFileSizeValid,
  fileToBase64,
  generateExportFilename,

  // Navigation
  isMobileScreen,
  pathToLabel,

  // Arrays
  groupBy,
  unique,
  sortByKey,

  // Validation
  validateTcNo,
  validatePhone,
  validateEmail,

  // DOM / Browser
  copyToClipboard,
  downloadDataUrl,
  scrollToElement,

  // Performance
  debounce,
  throttle,

  // Storage
  localStorageGet,
  localStorageSet,
} from './helpers';

// ==========================================
// API Client
// ==========================================

export {
  api,
  request,
  interceptors,
  deduplicatedGet,
  createCancellableRequest,
  authInterceptor,
  loggingInterceptor,
  type RequestConfig,
  type ApiResponse,
  type ApiError,
  type HttpMethod,
} from './api';

// ==========================================
// Form Validation
// ==========================================

export {
  Schema,
  createSchema,
  validateField,
  compose,
  validators,
  schemas,
  type ValidationResult,
  type ValidatorFn,
  type AsyncValidatorFn,
  type FieldRule,
} from './validation';

// ==========================================
// Export Utilities
// ==========================================

export {
  exportToPDF,
  exportToExcel,
  exportOverviewReport,
  exportIncidentsReport,
  exportTrainingsReport,
  exportPPEReport,
  exportRiskReport,
  exportPersonnelReport,
} from './exportUtils';

export {
  exportCertificatePDF,
  generateCertificatePDF,
} from './certificatePdfUtils';

export {
  downloadIncidentPDF,
  generateIncidentPDF,
  getIncidentPDFBlob,
  getIncidentPDFDataURL,
} from './incidentPdfUtils';

// ==========================================
// Token / Auth
// ==========================================

export { tokenManager, generateMockSession, generateMockToken, parseTokenPayload } from './tokenManager';

// ==========================================
// PDF / Turkish Helpers
// ==========================================

export {
  turkishToAscii,
  t,
  PDF_COLORS,
  PDF_FONTS,
  addLogo,
  addPdfHeader,
  addPdfFooter,
  addSectionTitle,
  addSubSectionTitle,
  addField,
  addFieldPair,
  addInfoBox,
  addStatusBadge,
  checkPageBreak,
  addMultiLineText,
  addBulletList,
  addDivider,
  formatDate,
  formatDateTime,
  formatShortDate,
} from './turkishPdfHelper';

// ==========================================
// Password Strength
// ==========================================

export {
  validatePasswordStrength,
  getPasswordRules,
} from './passwordStrength';
