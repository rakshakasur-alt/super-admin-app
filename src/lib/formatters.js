/**
 * Currency and date formatting helpers for admin-app
 */

const CURRENCY_SYMBOLS = {
  INR: 'â‚¹',
  USD: '$',
  EUR: 'â‚¬',
  GBP: 'Â£',
  AED: 'AED ',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'S$',
  JPY: 'Â¥'
};

/**
 * Get currency symbol for an ISO 4217 code
 */
export function getCurrencySymbol(currencyCode = 'INR') {
  const code = (currencyCode || 'INR').toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

/**
 * Format a numeric amount into local currency string with symbol
 */
export function formatCurrency(amount, currencyCode = 'INR') {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return `${getCurrencySymbol(currencyCode)}0`;

  const code = (currencyCode || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
      minimumFractionDigits: 0
    }).format(num);
  } catch (_) {
    const symbol = getCurrencySymbol(code);
    return `${symbol}${num.toLocaleString()}`;
  }
}
