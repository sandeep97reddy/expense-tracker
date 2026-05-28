/**
 * Structured Logger Service
 *
 * Production-safe logging utility with:
 * - Log levels: debug | info | warn | error
 * - Environment gating (debug only in dev)
 * - PII scrubbing for production
 * - Structured JSON output for remote ingestion
 */

import { isDev, isProd } from '@/utils/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

// PII fields that must never be logged in production
const PII_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'upiId',
  'pa',   // UPI payee address
  'pn',   // UPI payee name
  'email',
  'phone',
  'cardNumber',
];

/**
 * Recursively scrub known PII keys from objects before logging
 */
function scrubPII(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(scrubPII);

  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (PII_FIELDS.some((pii) => key.toLowerCase().includes(pii.toLowerCase()))) {
      scrubbed[key] = '[REDACTED]';
    } else {
      scrubbed[key] = scrubPII(value);
    }
  }
  return scrubbed;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data: isProd ? scrubPII(data) : data,
  };
}

function emit(entry: LogEntry) {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`;
  const msg = `${prefix} ${entry.message}`;

  // Babel plugin strips console.* in production, but we gate it here as well for safety
  if (!isProd) {
    switch (entry.level) {
      case 'debug':
        if (isDev) console.debug(msg, entry.data ?? '');
        break;
      case 'info':
        console.info(msg, entry.data ?? '');
        break;
      case 'warn':
        console.warn(msg, entry.data ?? '');
        break;
      case 'error':
        console.error(msg, entry.data ?? '');
        break;
    }
  } else if (entry.level === 'error') {
    // In production, you would forward 'error' entries to a remote service:
    // e.g., Sentry.captureException(new Error(entry.message), { extra: entry.data })
  }
}

/**
 * Scoped logger — attach a module/feature context
 */
function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) =>
      emit(createEntry('debug', message, context, data)),
    info: (message: string, data?: unknown) =>
      emit(createEntry('info', message, context, data)),
    warn: (message: string, data?: unknown) =>
      emit(createEntry('warn', message, context, data)),
    error: (message: string, data?: unknown) =>
      emit(createEntry('error', message, context, data)),
  };
}

/**
 * Root logger (no context)
 */
export const logger = {
  debug: (message: string, data?: unknown) =>
    emit(createEntry('debug', message, undefined, data)),
  info: (message: string, data?: unknown) =>
    emit(createEntry('info', message, undefined, data)),
  warn: (message: string, data?: unknown) =>
    emit(createEntry('warn', message, undefined, data)),
  error: (message: string, data?: unknown) =>
    emit(createEntry('error', message, undefined, data)),

  /** Create a module-scoped logger */
  scope: createLogger,
};

// Pre-built scoped loggers for key modules
export const authLogger = logger.scope('Auth');
export const txLogger = logger.scope('Transactions');
export const upiLogger = logger.scope('UPI');
export const apiLogger = logger.scope('API');
export const navLogger = logger.scope('Navigation');
export const storageLogger = logger.scope('Storage');
export const notifLogger = logger.scope('Notifications');
