/**
 * Form Validation Schema System
 *
 * A lightweight, type-safe form validation library with:
 * - Schema-based validation
 * - Turkish error messages
 * - Async validation support
 * - Custom validators
 * - Field-level and form-level validation
 * - React Hook Forms integration ready
 */

// ==========================================
// Types
// ==========================================

export type ValidationResult<T> = {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
};

export type ValidatorFn<T> = (value: T) => boolean | string;

export type AsyncValidatorFn<T> = (value: T) => Promise<boolean | string>;

export type FieldRule<T> = {
  required?: boolean | string;
  minLength?: { value: number; message?: string };
  maxLength?: { value: number; message?: string };
  pattern?: { value: RegExp; message?: string };
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
  custom?: ValidatorFn<T> | ValidatorFn<T>[];
  async?: AsyncValidatorFn<T> | AsyncValidatorFn<T>[];
  validate?: (value: T, formData?: unknown) => boolean | string | Promise<boolean | string>;
};

export interface SchemaConfig<T> {
  fields: Partial<Record<keyof T, FieldRule<T[keyof T]>>>;
  async?: true;
}

// ==========================================
// Default Messages
// ==========================================

const DEFAULT_MESSAGES = {
  required: 'Bu alan gereklidir',
  minLength: (min: number) => `En az ${min} karakter girişi yapmalısınız`,
  maxLength: (max: number) => `En fazla ${max} karakter girişi yapabilirsiniz`,
  pattern: 'Geçersiz format',
  min: (min: number) => `Değer ${min} veya daha büyük olmalıdır`,
  max: (max: number) => `Değer ${max} veya daha küçük olmalıdır`,
  invalid: 'Geçersiz değer',
  email: 'Geçersiz email adresi',
  phone: 'Geçersiz telefon numarası',
  url: 'Geçersiz URL',
  number: 'Sayı giriniz',
} as const;

// ==========================================
// Common Validators
// ==========================================

export const validators = {
  email: (value: string): boolean | string => {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || DEFAULT_MESSAGES.email;
  },

  phone: (value: string): boolean | string => {
    if (!value) return true;
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return /^(0?\d{10})$/.test(cleaned) || DEFAULT_MESSAGES.phone;
  },

  url: (value: string): boolean | string => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return DEFAULT_MESSAGES.url;
    }
  },

  number: (value: any): boolean | string => {
    if (value === '' || value === null || value === undefined) return true;
    const num = Number(value);
    return !isNaN(num) || DEFAULT_MESSAGES.number;
  },

  integer: (value: any): boolean | string => {
    if (value === '' || value === null || value === undefined) return true;
    return Number.isInteger(Number(value)) || 'Tam sayı giriniz';
  },

  turkishIdNo: (value: string): boolean | string => {
    if (!value || !/^\d{11}$/.test(value)) return 'Geçerli TC Kimlik Numarası giriniz';
    if (value[0] === '0') return 'Geçerli TC Kimlik Numarası giriniz';

    const digits = value.split('').map(Number);
    const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const even = digits[1] + digits[3] + digits[5] + digits[7];
    const d10 = (odd * 7 - even) % 10;
    const d11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;

    return (d10 === digits[9] && d11 === digits[10]) || 'Geçerli TC Kimlik Numarası giriniz';
  },

  minWords: (min: number) => (value: string): boolean | string => {
    if (!value) return true;
    const words = value.trim().split(/\s+/).length;
    return words >= min || `En az ${min} sözcük giriniz`;
  },

  match: (fieldValue: any, otherFieldValue: any, message = 'Alanlar eşleşmiyor') => {
    return fieldValue === otherFieldValue || message;
  },

  notEmpty: (value: any): boolean | string => {
    if (Array.isArray(value)) return value.length > 0 || 'En az bir seçim yapmalısınız';
    if (typeof value === 'string') return value.trim().length > 0 || DEFAULT_MESSAGES.required;
    return value !== null && value !== undefined || DEFAULT_MESSAGES.required;
  },
};

// ==========================================
// Schema Builder
// ==========================================

export class Schema<T extends Record<string, any>> {
  private config: SchemaConfig<T>;

  constructor(fields: Partial<Record<keyof T, FieldRule<T[keyof T]>>> = {}) {
    this.config = { fields };
  }

  /**
   * Add or update a field validation rule
   */
  field<K extends keyof T>(
    name: K,
    rule: FieldRule<T[K]>
  ): this {
    this.config.fields[name] = rule as any;
    return this;
  }

  /**
   * Add multiple fields at once
   */
  fields(fields: Partial<Record<keyof T, FieldRule<T[keyof T]>>>): this {
    Object.entries(fields).forEach(([key, rule]) => {
      this.config.fields[key as keyof T] = rule as any;
    });
    return this;
  }

  /**
   * Synchronous validation
   */
  validate(data: Partial<T>): ValidationResult<T> {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const [fieldName, rule] of Object.entries(this.config.fields)) {
      const value = (data as any)[fieldName];
      const fieldError = this.validateField(fieldName as keyof T, value, rule as any, data);

      if (typeof fieldError === 'string') {
        errors[fieldName as keyof T] = fieldError;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Asynchronous validation (returns a promise)
   */
  async validateAsync(data: Partial<T>): Promise<ValidationResult<T>> {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const [fieldName, rule] of Object.entries(this.config.fields)) {
      const value = (data as any)[fieldName];
      const fieldError = await this.validateFieldAsync(fieldName as keyof T, value, rule as any, data);

      if (typeof fieldError === 'string') {
        errors[fieldName as keyof T] = fieldError;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate a single field
   */
  private validateField(
    _fieldName: keyof T,
    value: any,
    rule: FieldRule<any>,
    formData?: Partial<T>
  ): boolean | string {
    // Required check
    if (rule.required) {
      if (value === '' || value === null || value === undefined) {
        return typeof rule.required === 'string' ? rule.required : DEFAULT_MESSAGES.required;
      }
    }

    // Skip further validation if empty and not required
    if (!rule.required && (value === '' || value === null || value === undefined)) {
      return true;
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength.value) {
        return rule.minLength.message ?? DEFAULT_MESSAGES.minLength(rule.minLength.value);
      }
      if (rule.maxLength && value.length > rule.maxLength.value) {
        return rule.maxLength.message ?? DEFAULT_MESSAGES.maxLength(rule.maxLength.value);
      }
      if (rule.pattern && !rule.pattern.value.test(value)) {
        return rule.pattern.message ?? DEFAULT_MESSAGES.pattern;
      }
    }

    // Number validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const num = Number(value);
      if (rule.min !== undefined && num < rule.min.value) {
        return rule.min.message ?? DEFAULT_MESSAGES.min(rule.min.value);
      }
      if (rule.max !== undefined && num > rule.max.value) {
        return rule.max.message ?? DEFAULT_MESSAGES.max(rule.max.value);
      }
    }

    // Custom validators
    if (rule.custom) {
      const validators = Array.isArray(rule.custom) ? rule.custom : [rule.custom];
      for (const validator of validators) {
        const result = validator(value);
        if (result !== true) return result;
      }
    }

    // Form-level validator
    if (rule.validate) {
      const result = rule.validate(value, formData);
      if (typeof result === 'string') return result;
      if (result === false) return DEFAULT_MESSAGES.invalid;
    }

    return true;
  }

  /**
   * Validate a single field with async support
   */
  private async validateFieldAsync(
    fieldName: keyof T,
    value: any,
    rule: FieldRule<any>,
    formData?: Partial<T>
  ): Promise<boolean | string> {
    // First run sync validation
    const syncResult = this.validateField(fieldName, value, rule, formData);
    if (syncResult !== true) return syncResult;

    // Run async validators
    if (rule.async) {
      const asyncValidators = Array.isArray(rule.async) ? rule.async : [rule.async];
      for (const validator of asyncValidators) {
        const result = await validator(value);
        if (result !== true) return result;
      }
    }

    return true;
  }
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Create a new schema
 */
export const createSchema = <T extends Record<string, any>>(
  fields?: Partial<Record<keyof T, FieldRule<T[keyof T]>>>
): Schema<T> => {
  return new Schema(fields);
};

/**
 * Validate a single field with inline rules
 */
export const validateField = <T>(
  value: T,
  rules: FieldRule<T>
): boolean | string => {
  const schema = new Schema<{ field: T }>({ field: rules as any });
  const result = schema.validate({ field: value });
  return result.errors.field || true;
};

/**
 * Compose multiple validators into one
 */
export const compose = <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> => {
  return (value: T): boolean | string => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) return result;
    }
    return true;
  };
};

// ==========================================
// Pre-built Schemas for Common Forms
// ==========================================

export const schemas = {
  /**
   * Login form schema
   */
  login: createSchema<{ email: string; password: string }>()
    .field('email', {
      required: true,
      custom: validators.email,
    })
    .field('password', {
      required: true,
      minLength: { value: 6 },
    }),

  /**
   * Register form schema
   */
  register: createSchema<{ firstName: string; lastName: string; email: string; password: string; confirmPassword: string }>()
    .field('firstName', { required: true })
    .field('lastName', { required: true })
    .field('email', {
      required: true,
      custom: validators.email,
    })
    .field('password', {
      required: true,
      minLength: { value: 8, message: 'Şifre en az 8 karakter olmalıdır' },
    })
    .field('confirmPassword', {
      required: true,
      validate: (val, data: any) => validators.match(val, data?.password, 'Şifreler eşleşmiyor'),
    }),

  /**
   * Company form schema
   */
  company: createSchema<{
    name: string;
    sector: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
  }>()
    .field('name', { required: true, minLength: { value: 3 } })
    .field('sector', { required: true })
    .field('contactPerson', { required: true })
    .field('email', {
      required: true,
      custom: validators.email,
    })
    .field('phone', {
      required: true,
      custom: validators.phone,
    })
    .field('address', { required: true, minLength: { value: 10 } }),

  /**
   * Personnel form schema
   */
  personnel: createSchema<{
    firstName: string;
    lastName: string;
    tcNo: string;
    role: string;
    email: string;
    phone: string;
    startDate: string;
  }>()
    .field('firstName', { required: true })
    .field('lastName', { required: true })
    .field('tcNo', {
      required: true,
      custom: validators.turkishIdNo,
    })
    .field('role', { required: true })
    .field('email', {
      required: true,
      custom: validators.email,
    })
    .field('phone', {
      required: true,
      custom: validators.phone,
    })
    .field('startDate', { required: true }),

  /**
   * Incident form schema
   */
  incident: createSchema<{
    title: string;
    description: string;
    companyId: string;
    date: string;
    location: string;
    severity: string;
    status: string;
  }>()
    .field('title', { required: true, minLength: { value: 5 } })
    .field('description', {
      required: true,
      minLength: { value: 20, message: 'Açıklama en az 20 karakter olmalıdır' },
    })
    .field('companyId', { required: true })
    .field('date', { required: true })
    .field('location', { required: true })
    .field('severity', { required: true })
    .field('status', { required: true }),

  /**
   * Contact form schema
   */
  contact: createSchema<{
    name: string;
    email: string;
    phone?: string;
    message: string;
  }>()
    .field('name', { required: true, minLength: { value: 3 } })
    .field('email', {
      required: true,
      custom: validators.email,
    })
    .field('phone', {
      required: false,
      custom: (value: string | undefined) => validators.phone(value ?? ''),
    })
    .field('message', {
      required: true,
      minLength: { value: 10, message: 'Mesaj en az 10 karakter olmalıdır' },
    }),
};
