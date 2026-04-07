/**
 * Shared constants used across the application
 */

// ==========================================
// Incident Types
// ==========================================

export const INCIDENT_TYPES = [
  'İş Kazası',
  'Ramak Kala',
  'Meslek Hastalığı',
  'Çevre Olayı',
  'Maddi Hasarlı Olay'
] as const;

export type IncidentType = typeof INCIDENT_TYPES[number];

// ==========================================
// Severity Levels
// ==========================================

export const SEVERITY_LEVELS = ['Düşük', 'Orta', 'Yüksek', 'Kritik'] as const;
export type Severity = typeof SEVERITY_LEVELS[number];

export const SEVERITY_COLORS = {
  'Düşük': {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  'Orta': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  'Yüksek': {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500'
  },
  'Kritik': {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500'
  }
} as const;

// ==========================================
// Incident Status
// ==========================================

export const INCIDENT_STATUSES = ['Açık', 'İnceleniyor', 'Kapalı'] as const;
export type IncidentStatus = typeof INCIDENT_STATUSES[number];

export const INCIDENT_STATUS_COLORS = {
  'Açık': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'İnceleniyor': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Kapalı': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
} as const;

// ==========================================
// Certificate Types
// ==========================================

export const CERTIFICATE_TYPES = [
  'İSG Eğitimi',
  'Yangın Güvenliği',
  'İlk Yardım',
  'Yüksekte Çalışma',
  'Forklift Operatörlüğü',
  'Elektrik Güvenliği',
  'Kimyasal Güvenlik',
  'Acil Durum Eğitimi',
  'Genel Güvenlik',
  'Diğer'
] as const;

export type CertificateType = typeof CERTIFICATE_TYPES[number];

// ==========================================
// Certificate Status
// ==========================================

export const CERTIFICATE_STATUSES = ['Aktif', 'Süresi Dolmuş', 'İptal Edildi'] as const;
export type CertificateStatus = typeof CERTIFICATE_STATUSES[number];

// ==========================================
// Training Status
// ==========================================

export const TRAINING_STATUSES = ['Planlandı', 'Tamamlandı', 'İptal'] as const;
export type TrainingStatus = typeof TRAINING_STATUSES[number];

export const TRAINING_STATUS_COLORS = {
  'Planlandı': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  'Tamamlandı': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'İptal': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
} as const;

// ==========================================
// PPE Types
// ==========================================

export const PPE_TYPES = [
  'Baret',
  'İş Ayakkabısı',
  'Eldiven',
  'Gözlük',
  'Reflektörlü Yelek',
  'Kulaklık',
  'Emniyet Kemeri',
  'Diğer'
] as const;

export type PPEType = typeof PPE_TYPES[number];

// ==========================================
// PPE Status
// ==========================================

export const PPE_STATUSES = ['Aktif', 'İade Edildi', 'Yıprandı/Kayıp'] as const;
export type PPEStatus = typeof PPE_STATUSES[number];

// ==========================================
// Risk Status
// ==========================================

export const RISK_STATUSES = ['Açık', 'Devam Ediyor', 'Giderildi'] as const;
export type RiskStatus = typeof RISK_STATUSES[number];

// ==========================================
// Personnel Roles
// ==========================================

export const PERSONNEL_ROLES = [
  // İSG Professionals
  'İşyeri Hekimi',
  'İş Güvenliği Uzmanı',
  'İşyeri Hemşiresi',
  'Sağlık Teknikeri',
  'İşyeri Hekimi Yardımcısı',
  'İş Güvenliği Teknikeri',
  'İşyeri Hekimi Asistanı',
  // Management
  'Müdür',
  'Genel Müdür',
  'Şantiye Şefi',
  'Bölge Müdürü',
  'İşletme Müdürü',
  'Fabrika Müdürü',
  // Technical
  'Mühendis',
  'Tekniker',
  'Teknisyen',
  'Mimar',
  // Production/Workers
  'Usta',
  'Kalfa',
  'İşçi',
  'Operatör',
  'Üretim Personeli',
  // Support
  'Sekreter',
  'Yönetici Asistanı',
  'Muhasebeci',
  'İnsan Kaynakları',
  'Satış Temsilcisi',
  'Sürücü',
  'Güvenlik Görevlisi',
  'Temizlik Personeli',
  // Other
  'Stajyer',
  'Geçici İşçi',
  'Taşeron Personeli',
  'Diğer'
] as const;

export type PersonnelRole = typeof PERSONNEL_ROLES[number];

// ==========================================
// Personnel Status
// ==========================================

export const PERSONNEL_STATUSES = ['Aktif', 'Pasif', 'İstifa Etti'] as const;
export type PersonnelStatus = typeof PERSONNEL_STATUSES[number];

// ==========================================
// Personnel Class
// ==========================================

export const PERSONNEL_CLASSES = ['A', 'B', 'C'] as const;
export type PersonnelClass = typeof PERSONNEL_CLASSES[number];

// ==========================================
// Blood Types
// ==========================================

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'] as const;
export type BloodType = typeof BLOOD_TYPES[number];

// ==========================================
// Employment Types
// ==========================================

export const EMPLOYMENT_TYPES = ['Tam zamanlı', 'Yarı zamanlı', 'Ofis', 'Geçici', 'Taşeron', 'Stajyer'] as const;

// ==========================================
// Injury Types
// ==========================================

export const INJURY_TYPES = [
  'Kırık-Çıkık',
  'Çatlak',
  'Ezilme',
  'Sıyrık',
  'Kesik',
  'Travma',
  'Bayılma',
  'Yanık',
  'Çapak kaçması',
  'Yumuşak doku zedelenmesi',
  'Kas zedelenmesi/yırtılması',
  'Batma/Delinme',
  'Burkulma',
  'Kas kasılması',
  'Zehirlenme',
  'Diğer'
] as const;

export type InjuryType = typeof INJURY_TYPES[number];

// ==========================================
// Severity Levels (Medical)
// ==========================================

export const SEVERITY_LEVELS_MEDICAL = [
  'Önemsiz',
  '0-1 Gün',
  '1-2 Gün',
  '3 Gün ve Sonrası',
  'Minör',
  'Ciddi/Majör'
] as const;

export type SeverityLevelMedical = typeof SEVERITY_LEVELS_MEDICAL[number];

// ==========================================
// Body Parts
// ==========================================

export const BODY_PARTS = [
  'Baş',
  'Yüz',
  'Göz',
  'El-El Bileği',
  'Parmak',
  'Kol-Omuz',
  'Boyun',
  'Ayak-Ayak Bileği',
  'Bacak',
  'Bel',
  'İç Organlar',
  'Göğüs-Karın',
  'Omurga',
  'Diğer'
] as const;

export type BodyPart = typeof BODY_PARTS[number];

// ==========================================
// Pagination
// ==========================================

export const PAGE_SIZE_OPTIONS = [6, 10, 12, 20, 24, 48, 50, 100] as const;
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];

export const DEFAULT_PAGE_SIZE = 10;

// ==========================================
// Date Ranges
// ==========================================

export const DATE_RANGE_OPTIONS = [
  { value: 7, label: 'Son 7 gün' },
  { value: 30, label: 'Son 30 gün' },
  { value: 90, label: 'Son 90 gün' },
  { value: 365, label: 'Son 1 yıl' }
] as const;

// ==========================================
// View Modes
// ==========================================

export const VIEW_MODES = ['grid', 'list'] as const;
export type ViewMode = typeof VIEW_MODES[number];

// ==========================================
// Form Input Styles
// ==========================================

export const INPUT_STYLES = {
  base: 'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all',
  select: 'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all',
  textarea: 'flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 transition-all resize-none'
} as const;

// ==========================================
// Animation Durations
// ==========================================

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300
} as const;

// ==========================================
// Storage Keys
// ==========================================

export const STORAGE_KEYS = {
  AUTH: 'hantech-auth-storage-v2',
  MAIN: 'hantech-storage-v7',
  THEME: 'hantech-theme',
  SIDEBAR_COLLAPSED: 'hantech-sidebar-collapsed'
} as const;

// ==========================================
// API Routes (for future use)
// ==========================================

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    RESET_PASSWORD: '/api/auth/reset-password',
    FORGOT_PASSWORD: '/api/auth/forgot-password'
  },
  INCIDENTS: '/api/incidents',
  TRAININGS: '/api/trainings',
  CERTIFICATES: '/api/certificates',
  PERSONNEL: '/api/personnel',
  COMPANIES: '/api/companies',
  RISKS: '/api/risks',
  PPE: '/api/ppe'
} as const;

// ==========================================
// Error Messages
// ==========================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
  UNAUTHORIZED: 'Bu işlem için yetkiniz yok.',
  NOT_FOUND: 'İstenen kayıt bulunamadı.',
  VALIDATION_ERROR: 'Girdiğiniz bilgiler doğrulanamadı.',
  SERVER_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu.'
} as const;

// ==========================================
// Success Messages
// ==========================================

export const SUCCESS_MESSAGES = {
  CREATED: 'Kayıt başarıyla oluşturuldu.',
  UPDATED: 'Kayıt başarıyla güncellendi.',
  DELETED: 'Kayıt başarıyla silindi.',
  SAVED: 'Değişiklikler kaydedildi.',
  SENT: 'İşlem başarıyla tamamlandı.'
} as const;

// ==========================================
// File Size Limits
// ==========================================

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  TOTAL: 20 * 1024 * 1024 // 20MB
} as const;

// ==========================================
// Accepted File Types
// ==========================================

export const ACCEPTED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const;

// ==========================================
// Turkish Month Names (for charts)
// ==========================================

export const TURKISH_MONTHS = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
] as const;

// ==========================================
// Session Constants
// ==========================================

export const SESSION_CONFIG = {
  TOKEN_REFRESH_INTERVAL: 60000, // 1 minute
  SESSION_CHECK_INTERVAL: 30000, // 30 seconds
  WARNING_THRESHOLD: 300 // 5 minutes before expiry (in seconds)
} as const;

// ==========================================
// Safety Score Calculation Weights
// ==========================================

export const SAFETY_SCORE_WEIGHTS = {
  OPEN_INCIDENT: 5,
  HIGH_RISK: 8,
  LOW_COMPLETION_RATE: 20,
  DAMAGED_PPE: 3,
  MAX_DEDUCTION_OPEN_INCIDENT: 30,
  MAX_DEDUCTION_HIGH_RISK: 25,
  MAX_DEDUCTION_DAMAGED_PPE: 15
} as const;

// ==========================================
// Toast Position Options
// ==========================================

export const TOAST_POSITIONS = [
  'top-center',
  'top-right',
  'top-left',
  'bottom-center',
  'bottom-right',
  'bottom-left'
] as const;

// ==========================================
// Export all types as a grouped namespace
// ==========================================

export const Constants = {
  INCIDENT_TYPES,
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  INCIDENT_STATUSES,
  INCIDENT_STATUS_COLORS,
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUSES,
  TRAINING_STATUSES,
  TRAINING_STATUS_COLORS,
  PPE_TYPES,
  PPE_STATUSES,
  RISK_STATUSES,
  PERSONNEL_ROLES,
  PERSONNEL_STATUSES,
  PERSONNEL_CLASSES,
  BLOOD_TYPES,
  EMPLOYMENT_TYPES,
  INJURY_TYPES,
  SEVERITY_LEVELS_MEDICAL,
  BODY_PARTS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  DATE_RANGE_OPTIONS,
  VIEW_MODES,
  INPUT_STYLES,
  ANIMATION_DURATIONS,
  STORAGE_KEYS,
  API_ROUTES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FILE_SIZE_LIMITS,
  ACCEPTED_FILE_TYPES,
  TURKISH_MONTHS,
  SESSION_CONFIG,
  SAFETY_SCORE_WEIGHTS,
  TOAST_POSITIONS
} as const;
