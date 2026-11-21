/**
 * Returns the URL only if it is an absolute http(s) URL, otherwise null.
 *
 * Hotel owners control logo / avatar / banner / dish image URLs. React 18
 * renders `javascript:` URLs in href (it only warns), so every owner-supplied
 * URL must pass through this before it is used as a link target.
 */
export function safeExternalUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch (_) {
    return null;
  }
}
