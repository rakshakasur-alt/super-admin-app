/**
 * Password rules for new passwords (sign-up, reset). Login does not apply
 * them, so existing accounts with older, shorter passwords can still sign in.
 * Keep MIN_PASSWORD_LENGTH in sync with Supabase Auth → Password settings.
 */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt (Supabase Auth) ignores bytes beyond 72

const COMMON = [
  'password', 'passw0rd', 'qwerty', 'letmein', 'welcome', 'admin', 'iloveyou',
  '123456', '12345678', '123456789', '1234567890', 'abc123', 'football', 'monkey',
];

/** Returns an error message, or null when the password is acceptable. */
export function passwordPolicyError(password) {
  const pw = String(password || '');
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  // UTF-8 byte length (works in every browser and test environment).
  if (encodeURIComponent(pw).replace(/%[0-9A-F]{2}/g, '_').length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`;
  }
  if (/^(.)\1+$/.test(pw)) {
    return 'Password cannot be a single repeated character.';
  }
  // "Password1234!", "qwerty2024" and all-digit passwords are rejected.
  const stripped = pw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const core = stripped.replace(/\d+$/, '');
  if (/^\d+$/.test(stripped) || COMMON.includes(core) || COMMON.includes(stripped)) {
    return 'This password is too common. Please choose a less predictable one.';
  }
  return null;
}
