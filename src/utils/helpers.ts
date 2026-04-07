/**
 * Shared helper utilities used across the application
 */

import {
  SEVERITY_COLORS,
  INCIDENT_STATUS_COLORS,
  TRAINING_STATUS_COLORS,
  SAFETY_SCORE_WEIGHTS,
  TURKISH_MONTHS,
  FILE_SIZE_LIMITS
} from '../constants';

// ==========================================
// ID Generation
// ==========================================

/**
 * Generates a unique ID using timestamp + random string
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generates a zero-padded sequential certificate/record number
 */
export const generateRecordNo = (prefix: string, index: number, padLength = 4): string => {
  return `${prefix}-${String(index).padStart(padLength, '0')}`;
};

// ==========================================
// Date & Time Utilities
// ==========================================

/**
 * Formats a date string to Turkish locale short date
 */
export const formatDateTR = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  } catch {
    return '-';
  }
};

/**
 * Formats a date string to Turkish locale full date
 */
export const formatDateLongTR = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
};

/**
 * Formats a date string to Turkish locale short date + time
 */
export const formatDateTimeTR = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  } catch {
    return '-';
  }
};

/**
 * Formats a date string to Turkish locale full date + time
 */
export const formatDateTimeLongTR = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

/**
 * Returns an ISO date string for datetime-local input
 */
export const toDatetimeLocalString = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    return dateStr.substring(0, 16);
  } catch {
    return '';
  }
};

/**
 * Returns an ISO date string for date input (YYYY-MM-DD)
 */
export const toDateInputString = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Checks whether a date is in the past
 */
export const isExpired = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  try {
    return new Date(dateStr) < new Date();
  } catch {
    return false;
  }
};

/**
 * Returns the number of days until a given date
 * Negative means already passed
 */
export const daysUntil = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  try {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
};

/**
 * Gets the last N months as an array of { month: string, index: number }
 */
export const getLastNMonths = (n: number): { month: string; index: number }[] => {
  const currentMonth = new Date().getMonth();
  return Array.from({ length: n }, (_, i) => {
    const idx = (currentMonth - (n - 1 - i) + 12) % 12;
    return { month: TURKISH_MONTHS[idx], index: idx };
  });
};

// ==========================================
// Safety Score
// ==========================================

export interface SafetyScoreInput {
  openIncidents: number;
  highRisks: number;
  trainings: { status: string }[];
  completedTrainings: number;
  damagedPPEs: number;
}

/**
 * Calculates a 0-100 safety score from ISG metrics
 */
export const calculateSafetyScore = ({
  openIncidents,
  highRisks,
  trainings,
  completedTrainings,
  damagedPPEs
}: SafetyScoreInput): number => {
  let score = 100;
  score -= Math.min(openIncidents * SAFETY_SCORE_WEIGHTS.OPEN_INCIDENT, SAFETY_SCORE_WEIGHTS.MAX_DEDUCTION_OPEN_INCIDENT);
  score -= Math.min(highRisks * SAFETY_SCORE_WEIGHTS.HIGH_RISK, SAFETY_SCORE_WEIGHTS.MAX_DEDUCTION_HIGH_RISK);
  if (trainings.length > 0) {
    const rate = completedTrainings / trainings.length;
    score -= Math.round((1 - rate) * SAFETY_SCORE_WEIGHTS.LOW_COMPLETION_RATE);
  }
  score -= Math.min(damagedPPEs * SAFETY_SCORE_WEIGHTS.DAMAGED_PPE, SAFETY_SCORE_WEIGHTS.MAX_DEDUCTION_DAMAGED_PPE);
  return Math.max(0, Math.min(100, score));
};

/**
 * Returns the tailwind text color class for a given safety score
 */
export const getSafetyScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
};

/**
 * Returns the tailwind gradient class for a given safety score
 */
export const getSafetyScoreGradient = (score: number): string => {
  if (score >= 80) return 'from-emerald-500 to-teal-600';
  if (score >= 60) return 'from-amber-500 to-orange-600';
  return 'from-red-500 to-rose-600';
};

/**
 * Returns a human-readable label for a given safety score
 */
export const getSafetyScoreLabel = (score: number): string => {
  if (score >= 80) return 'İyi';
  if (score >= 60) return 'Orta';
  return 'Dikkat';
};

// ==========================================
// Severity / Status Color Utilities
// ==========================================

/**
 * Returns the full tailwind class set for a given severity
 */
export const getSeverityClasses = (
  severity: string,
  parts: ('bg' | 'text' | 'border' | 'dot')[] = ['bg', 'text', 'border']
): string => {
  const colorSet = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS];
  if (!colorSet) return 'bg-gray-100 text-gray-800 border-gray-200';
  return parts.map(p => colorSet[p]).join(' ');
};

/**
 * Returns the severity dot background class
 */
export const getSeverityDotColor = (severity: string): string => {
  return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]?.dot ?? 'bg-gray-500';
};

/**
 * Returns the incident status tailwind classes
 */
export const getIncidentStatusClasses = (status: string): string => {
  return INCIDENT_STATUS_COLORS[status as keyof typeof INCIDENT_STATUS_COLORS] ?? 'bg-gray-100 text-gray-800';
};

/**
 * Returns the training status tailwind classes
 */
export const getTrainingStatusClasses = (status: string): string => {
  return TRAINING_STATUS_COLORS[status as keyof typeof TRAINING_STATUS_COLORS] ?? 'bg-gray-100 text-gray-800';
};

// ==========================================
// Risk Score Utilities
// ==========================================

/**
 * Returns the risk level label for a given score
 */
export const getRiskLevelLabel = (score: number): string => {
  if (score > 12) return 'Yüksek';
  if (score > 6) return 'Orta';
  return 'Düşük';
};

/**
 * Returns tailwind color classes for a risk score
 */
export const getRiskScoreClasses = (score: number): string => {
  if (score > 12) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (score > 6) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
};

// ==========================================
// String Utilities
// ==========================================

/**
 * Truncates a string to maxLength with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}…` : str;
};

/**
 * Converts a string to title case (first letter of each word capitalized)
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generates user initials from first + last name
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
};

/**
 * Returns the full name from first + last name parts
 */
export const getFullName = (firstName?: string, lastName?: string): string => {
  return [firstName, lastName].filter(Boolean).join(' ');
};

/**
 * Normalizes Turkish characters for search comparison
 */
export const normalizeTurkish = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

/**
 * Case-insensitive search with Turkish character normalization
 */
export const matchesSearch = (text: string, query: string): boolean => {
  if (!query) return true;
  return normalizeTurkish(text).includes(normalizeTurkish(query));
};

// ==========================================
// Number Utilities
// ==========================================

/**
 * Formats a percentage to a fixed decimal string
 */
export const formatPercentage = (value: number, total: number, decimals = 0): string => {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(decimals);
};

/**
 * Returns a percentage number 0-100
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// ==========================================
// File Utilities
// ==========================================

/**
 * Formats bytes to a human-readable file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Checks if a file is within the allowed size limit
 */
export const isFileSizeValid = (bytes: number, type: 'IMAGE' | 'DOCUMENT' | 'TOTAL' = 'IMAGE'): boolean => {
  return bytes <= FILE_SIZE_LIMITS[type];
};

/**
 * Converts a File to a base64 data URL string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a timestamped export filename
 */
export const generateExportFilename = (prefix: string, extension: 'pdf' | 'xlsx' | 'csv' = 'pdf'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${extension}`;
};

// ==========================================
// URL / Navigation Utilities
// ==========================================

/**
 * Checks if the current screen is a mobile screen (< 1024px)
 */
export const isMobileScreen = (): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < 1024;
};

/**
 * Generates the breadcrumb label from a path segment
 */
export const pathToLabel = (segment: string): string => {
  const labels: Record<string, string> = {
    '': 'Dashboard',
    'companies': 'Firmalar',
    'personnel': 'Personeller',
    'incidents': 'Kaza ve Olaylar',
    'trainings': 'Eğitimler',
    'certificates': 'Sertifikalar',
    'risks': 'Risk Değerlendirme',
    'ppe': 'KKD Takibi',
    'reports': 'Analizler ve Raporlar',
    'settings': 'Ayarlar',
    'profile': 'Profilim',
    'new': 'Yeni',
  };
  return labels[segment] ?? toTitleCase(segment);
};

// ==========================================
// Array Utilities
// ==========================================

/**
 * Groups an array by a key function
 */
export const groupBy = <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Returns unique values from an array
 */
export const unique = <T>(array: T[]): T[] => [...new Set(array)];

/**
 * Sorts an array of objects by a string or number key
 */
export const sortByKey = <T extends Record<string, unknown>>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' ? aVal.localeCompare(bVal, 'tr') : bVal.localeCompare(aVal, 'tr');
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });
};

// ==========================================
// Validation Utilities
// ==========================================

/**
 * Validates a Turkish TC number (basic mod-11 check)
 */
export const validateTcNo = (tc: string): boolean => {
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === '0') return false;
  const digits = tc.split('').map(Number);
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const even = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = (odd * 7 - even) % 10;
  const d11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d10 === digits[9] && d11 === digits[10];
};

/**
 * Validates a phone number format (10 digits after removing spaces/dashes)
 */
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(0?\d{10})$/.test(cleaned);
};

/**
 * Validates an email address format
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ==========================================
// DOM / Browser Utilities
// ==========================================

/**
 * Copies text to the clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Triggers a file download from a data URL
 */
export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Scrolls to an element by ID with smooth behavior
 */
export const scrollToElement = (id: string, offset = 0): void => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
};

// ==========================================
// Debounce / Throttle
// ==========================================

/**
 * Returns a debounced version of a function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Returns a throttled version of a function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
};

// ==========================================
// Local Storage Utilities
// ==========================================

/**
 * Safely reads a value from localStorage with JSON parsing
 */
export const localStorageGet = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
};

/**
 * Safely writes a value to localStorage with JSON serialization
 */
export const localStorageSet = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
