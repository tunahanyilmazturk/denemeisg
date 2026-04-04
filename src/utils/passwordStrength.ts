// ==========================================
// Password Strength Validator
// ==========================================

import { PasswordStrength } from '../types/auth';

const COMMON_PASSWORDS = [
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon',
  '123123', 'baseball', 'abc123', 'football', 'monkey',
  'letmein', 'shadow', 'master', '666666', 'qwertyuiop',
  '123321', 'mustang', '1234567890', 'michael', '654321',
  'superman', '1qaz2wsx', '7777777', '121212', '000000',
  'qazwsx', '123qwe', 'killer', 'trustno1', 'jordan',
  'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'hunter2',
];

export function validatePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, label: 'Boş', color: '#94a3b8', suggestions: ['Bir şifre girin'] };
  }

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 0.5;

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  const hasTurkish = /[çğıöşüÇĞİÖŞÜ]/.test(password);

  if (hasLowercase) score += 0.5;
  if (hasUppercase) score += 0.5;
  if (hasNumbers) score += 0.5;
  if (hasSpecial) score += 1;
  if (hasTurkish) score += 0.5;

  // Variety bonus
  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;
  if (varietyCount >= 3) score += 0.5;
  if (varietyCount >= 4) score += 0.5;

  // Penalize common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = 0;
    suggestions.push('Bu şifre çok yaygın kullanılmaktadır');
  }

  // Penalize sequential characters
  if (/(?:abc|bcd|cde|def|efg|123|234|345|456|567|678|789|qwe|wer|ert|rty|asd|sdf|dfg)/i.test(password)) {
    score -= 0.5;
    suggestions.push('Ardışık karakterler kullanmayın');
  }

  // Penalize repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    suggestions.push('Aynı karakteri tekrarlamayın');
  }

  // Generate suggestions
  if (password.length < 8) suggestions.push('En az 8 karakter kullanın');
  if (password.length < 12) suggestions.push('12+ karakter önerilir');
  if (!hasUppercase) suggestions.push('Büyük harf ekleyin');
  if (!hasLowercase) suggestions.push('Küçük harf ekleyin');
  if (!hasNumbers) suggestions.push('Rakam ekleyin');
  if (!hasSpecial) suggestions.push('Özel karakter ekleyin (!@#$%...)');

  // Clamp score
  score = Math.max(0, Math.min(4, Math.round(score)));

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Çok Zayıf', color: '#ef4444' },
    1: { label: 'Zayıf', color: '#f97316' },
    2: { label: 'Orta', color: '#eab308' },
    3: { label: 'Güçlü', color: '#22c55e' },
    4: { label: 'Çok Güçlü', color: '#10b981' },
  };

  return {
    score,
    label: labels[score].label,
    color: labels[score].color,
    suggestions: suggestions.length > 0 ? suggestions : ['Şifreniz yeterince güçlü'],
  };
}

export function getPasswordRules(): { rule: string; test: (pw: string) => boolean }[] {
  return [
    { rule: 'En az 8 karakter', test: (pw) => pw.length >= 8 },
    { rule: 'Bir büyük harf', test: (pw) => /[A-Z]/.test(pw) },
    { rule: 'Bir küçük harf', test: (pw) => /[a-z]/.test(pw) },
    { rule: 'Bir rakam', test: (pw) => /[0-9]/.test(pw) },
    { rule: 'Bir özel karakter', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw) },
  ];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+90|0)?[0-9]{3}[0-9]{3}[0-9]{2}[0-9]{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
