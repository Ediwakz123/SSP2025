// =============================================================================
// FORM VALIDATION UTILITIES
// Provides consistent validation across all forms
// =============================================================================

// -----------------------------------------------------------------------------
// VALIDATION RESULT TYPE
// -----------------------------------------------------------------------------

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FieldValidation {
  [field: string]: ValidationResult;
}

// -----------------------------------------------------------------------------
// EMAIL VALIDATION
// -----------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: "Email is required" };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// PASSWORD VALIDATION
// -----------------------------------------------------------------------------

export interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  minLength: 8,
  requireUppercase: false,
  requireLowercase: false,
  requireNumber: false,
  requireSpecial: false,
};

export function validatePassword(
  password: string,
  options: PasswordOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_PASSWORD_OPTIONS, ...options };

  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < (opts.minLength || 8)) {
    return {
      isValid: false,
      error: `Password must be at least ${opts.minLength} characters`,
    };
  }

  if (opts.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (opts.requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (opts.requireNumber && !/\d/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
    };
  }

  if (opts.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { isValid: true };
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// TEXT VALIDATION
// -----------------------------------------------------------------------------

export interface TextOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

export function validateText(
  value: string,
  fieldName: string,
  options: TextOptions = {}
): ValidationResult {
  const trimmed = value.trim();

  if (options.required && !trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (trimmed && options.minLength && trimmed.length < options.minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${options.minLength} characters`,
    };
  }

  if (trimmed && options.maxLength && trimmed.length > options.maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${options.maxLength} characters`,
    };
  }

  if (trimmed && options.pattern && !options.pattern.test(trimmed)) {
    return {
      isValid: false,
      error: options.patternMessage || `Invalid ${fieldName} format`,
    };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// NUMBER VALIDATION
// -----------------------------------------------------------------------------

export interface NumberOptions {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
}

export function validateNumber(
  value: string | number,
  fieldName: string,
  options: NumberOptions = {}
): ValidationResult {
  const stringValue = String(value).trim();

  if (options.required && !stringValue) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (!stringValue) {
    return { isValid: true };
  }

  const numValue = Number(stringValue);

  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (options.integer && !Number.isInteger(numValue)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }

  if (options.min !== undefined && numValue < options.min) {
    return { isValid: false, error: `${fieldName} must be at least ${options.min}` };
  }

  if (options.max !== undefined && numValue > options.max) {
    return { isValid: false, error: `${fieldName} must be at most ${options.max}` };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// PHONE NUMBER VALIDATION
// -----------------------------------------------------------------------------

const PHONE_REGEX = /^[\d\s\-+()]{10,}$/;

export function validatePhoneNumber(
  phone: string,
  required = false
): ValidationResult {
  const trimmed = phone.trim();

  if (required && !trimmed) {
    return { isValid: false, error: "Phone number is required" };
  }

  if (trimmed && !PHONE_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid phone number" };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// DATE VALIDATION
// -----------------------------------------------------------------------------

export function validateDate(
  date: string,
  fieldName: string,
  options: { required?: boolean; minDate?: Date; maxDate?: Date } = {}
): ValidationResult {
  const trimmed = date.trim();

  if (options.required && !trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (!trimmed) {
    return { isValid: true };
  }

  const dateValue = new Date(trimmed);

  if (isNaN(dateValue.getTime())) {
    return { isValid: false, error: `Invalid ${fieldName}` };
  }

  if (options.minDate && dateValue < options.minDate) {
    return { isValid: false, error: `${fieldName} is too early` };
  }

  if (options.maxDate && dateValue > options.maxDate) {
    return { isValid: false, error: `${fieldName} is too late` };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// AGE VALIDATION
// -----------------------------------------------------------------------------

export function validateAge(
  age: string | number,
  minAge = 18,
  maxAge = 120
): ValidationResult {
  const ageNum = typeof age === "string" ? parseInt(age, 10) : age;

  if (isNaN(ageNum)) {
    return { isValid: false, error: "Please enter a valid age" };
  }

  if (ageNum < minAge) {
    return { isValid: false, error: `You must be at least ${minAge} years old` };
  }

  if (ageNum > maxAge) {
    return { isValid: false, error: `Please enter a valid age` };
  }

  return { isValid: true };
}

// -----------------------------------------------------------------------------
// ADDRESS VALIDATION (Sta. Cruz, Santa Maria, Bulacan)
// -----------------------------------------------------------------------------

export interface AddressValidationResult extends ValidationResult {
  isFlagged?: boolean;
}

export function validateAddress(address: string): AddressValidationResult {
  const trimmed = address.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: "Address is required" };
  }

  // Check for Sta. Cruz or Santa Cruz
  const hasStaCruz = trimmed.includes("sta. cruz") ||
    trimmed.includes("sta cruz") ||
    trimmed.includes("santa cruz");

  // Check for Santa Maria
  const hasSantaMaria = trimmed.includes("santa maria");

  // Check for Bulacan
  const hasBulacan = trimmed.includes("bulacan");

  if (hasStaCruz && hasSantaMaria && hasBulacan) {
    return { isValid: true, isFlagged: false };
  }

  // Address is outside target area - still valid for form but will be flagged
  return {
    isValid: true,
    isFlagged: true
  };
}

// -----------------------------------------------------------------------------
// COORDINATES VALIDATION
// -----------------------------------------------------------------------------

export function validateLatitude(lat: number): ValidationResult {
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return { isValid: false, error: "Latitude must be between -90 and 90" };
  }
  return { isValid: true };
}

export function validateLongitude(lng: number): ValidationResult {
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return { isValid: false, error: "Longitude must be between -180 and 180" };
  }
  return { isValid: true };
}

// -----------------------------------------------------------------------------
// SANITIZATION UTILITIES
// -----------------------------------------------------------------------------

export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

// -----------------------------------------------------------------------------
// FORM VALIDATION HELPER
// -----------------------------------------------------------------------------

export function validateForm(validations: FieldValidation): {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
} {
  const errors: Record<string, string> = {};
  let firstError: string | undefined;

  for (const [field, result] of Object.entries(validations)) {
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      if (!firstError) {
        firstError = result.error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
}
