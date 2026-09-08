export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid request payload"] };
  }

  // Name validation
  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Email validation
  if (!data.email || typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim())) {
    errors.push("A valid email address is required");
  }

  // Password validation
  if (!data.password || typeof data.password !== "string") {
    errors.push("Password is required");
  } else {
    if (data.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(data.password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(data.password) && !/[^a-zA-Z0-9]/.test(data.password)) {
      errors.push("Password must contain at least one number or special character");
    }
  }

  // Role validation: strictly CLIENT or FREELANCER (ADMIN forbidden)
  if (data.role === "ADMIN") {
    errors.push("ADMIN registration is forbidden via public registration");
  } else if (!data.role || (data.role !== "CLIENT" && data.role !== "FREELANCER")) {
    errors.push("Role must be either CLIENT or FREELANCER");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginInput(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid request payload"] };
  }

  if (!data.email || typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim())) {
    errors.push("Valid email is required");
  }

  if (!data.password || typeof data.password !== "string" || data.password.length === 0) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
