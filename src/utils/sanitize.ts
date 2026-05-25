/**
 * Input Sanitization Utilities
 *
 * Provides centralized sanitization functions to strip potentially
 * dangerous content from user-supplied strings before storage or display.
 *
 * Security Pillar 1: Sanitization & Injection Prevention
 */

/**
 * Strip HTML tags from a string to prevent XSS via stored content.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Remove script-injection attempts (javascript: URIs, event handlers).
 */
export function stripScriptPatterns(input: string): string {
  return input
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

/**
 * Sanitize a general user text input (notes, titles, tags).
 * Strips HTML and script injection patterns.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return stripScriptPatterns(stripHtml(input));
}

/**
 * Sanitize a numeric string — only allow digits and one decimal point.
 */
export function sanitizeNumericString(input: string): string {
  const cleaned = input.replace(/[^0-9.]/g, '');
  // Allow at most one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return cleaned;
}

/**
 * Sanitize a URL parameter value — decode and strip dangerous content.
 */
export function sanitizeUrlParam(input: string): string {
  try {
    const decoded = decodeURIComponent(input);
    return stripScriptPatterns(stripHtml(decoded));
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize a UPI ID (VPA).
 * Format: localpart@provider (e.g. user@gpay, merchant@ybl)
 */
export function sanitizeUPIId(input: string): string | null {
  const cleaned = input.trim().toLowerCase();
  // UPI VPA pattern: [a-z0-9._-]+@[a-z]+
  const upiPattern = /^[a-z0-9._\-]+@[a-z]+$/;
  if (!upiPattern.test(cleaned)) return null;
  return cleaned;
}

/**
 * Truncate a string to a maximum safe length (prevents overflow attacks).
 */
export function truncate(input: string, maxLength: number = 500): string {
  return input.length > maxLength ? input.substring(0, maxLength) : input;
}

/**
 * Full sanitize pipeline for a transaction title/note field.
 */
export function sanitizeTransactionText(input: string): string {
  return truncate(sanitizeText(input), 200);
}
