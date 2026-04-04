/**
 * Currency formatting utilities for the Ensigo Trace application
 * Provides consistent currency formatting with commas and currency specification
 */

/**
 * Format a number as currency with proper formatting
 * @param amount - The amount to format
 * @param currency - Currency code (e.g., 'UGX', 'USD', 'KES')
 * @param locale - Locale for formatting (default: 'en-UG')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "UGX",
  locale: string = "en-UG"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas (no currency symbol)
 * @param value - The number to format
 * @param locale - Locale for formatting (default: 'en-UG')
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: string = "en-UG"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format currency with compact notation for large numbers
 * @param amount - The amount to format
 * @param currency - Currency code (e.g., 'UGX', 'USD', 'KES')
 * @param locale - Locale for formatting (default: 'en-UG')
 * @returns Formatted currency string with compact notation
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = "UGX",
  locale: string = "en-UG"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Parse a formatted currency string back to a number
 * @param formattedValue - The formatted currency string
 * @param locale - Locale for parsing (default: 'en-UG')
 * @returns Parsed number
 */
export function parseCurrency(
  formattedValue: string,
  locale: string = "en-UG"
): number {
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = formattedValue.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol from currency code
 * @param currency - Currency code (e.g., 'UGX', 'USD', 'KES')
 * @param locale - Locale for formatting (default: 'en-UG')
 * @returns Currency symbol
 */
export function getCurrencySymbol(
  currency: string = "UGX",
  locale: string = "en-UG"
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(0);

  // Extract symbol by removing the number
  return formatted.replace(/0/g, "").trim();
}

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];
