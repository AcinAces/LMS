export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirements {
  const p = password || '';
  const minLength = p.length >= 12;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(p);

  return {
    minLength,
    hasUppercase,
    hasLowercase,
    hasSpecialChar,
    isValid: minLength && hasUppercase && hasLowercase && hasSpecialChar,
  };
}
