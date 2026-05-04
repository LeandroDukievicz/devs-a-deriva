export interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail?: string;
  originalEmail?: string;
  reason?: string;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;
const MAX_DOMAIN_LENGTH = 253;
const CONTROL_OR_INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/;
const OBVIOUS_INJECTION = /(<\s*script|javascript:|data:text\/html|bcc:|cc:|content-type:|%0a|%0d)/i;
const ASCII_DOMAIN_LABEL = /^[a-z0-9-]+$/i;

export function validateAndNormalizeEmail(input: unknown): EmailValidationResult {
  if (typeof input !== 'string') {
    return { isValid: false, reason: 'invalid_type' };
  }

  const originalEmail = input.trim();

  if (!originalEmail) {
    return { isValid: false, reason: 'empty' };
  }

  if (originalEmail.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, originalEmail, reason: 'too_long' };
  }

  if (CONTROL_OR_INVISIBLE.test(originalEmail) || OBVIOUS_INJECTION.test(originalEmail)) {
    return { isValid: false, originalEmail, reason: 'unsafe_characters' };
  }

  const atMatches = originalEmail.match(/@/g);
  if (!atMatches || atMatches.length !== 1) {
    return { isValid: false, originalEmail, reason: 'invalid_at_count' };
  }

  const [localPart, rawDomain] = originalEmail.split('@');
  if (!localPart || !rawDomain) {
    return { isValid: false, originalEmail, reason: 'missing_parts' };
  }

  if (localPart.length > MAX_LOCAL_LENGTH || rawDomain.length > MAX_DOMAIN_LENGTH) {
    return { isValid: false, originalEmail, reason: 'part_too_long' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, originalEmail, reason: 'invalid_local_part' };
  }

  if (/[<>()\[\]\\,;:\s"]/.test(localPart)) {
    return { isValid: false, originalEmail, reason: 'invalid_local_part' };
  }

  if (rawDomain.includes('..') || !rawDomain.includes('.')) {
    return { isValid: false, originalEmail, reason: 'invalid_domain' };
  }

  let domain = '';
  try {
    domain = new URL(`https://${rawDomain}`).hostname.toLowerCase();
  } catch {
    return { isValid: false, originalEmail, reason: 'invalid_domain' };
  }

  if (!domain || domain.length > MAX_DOMAIN_LENGTH || !domain.includes('.') || domain.includes('..')) {
    return { isValid: false, originalEmail, reason: 'invalid_domain' };
  }

  const labels = domain.split('.');
  if (labels.some(label => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-') || !ASCII_DOMAIN_LABEL.test(label))) {
    return { isValid: false, originalEmail, reason: 'invalid_domain_label' };
  }

  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) {
    return { isValid: false, originalEmail, reason: 'invalid_tld' };
  }

  return {
    isValid: true,
    originalEmail,
    normalizedEmail: `${localPart}@${domain}`,
  };
}
