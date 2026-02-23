/**
 * Environment-aware logging utility
 * Only logs in development mode to keep production clean
 */

const isDev = import.meta.env.DEV;

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  emoji?: string;
  context?: string;
}

const formatMessage = (message: string, options?: LogOptions): string => {
  const parts: string[] = [];
  if (options?.emoji) parts.push(options.emoji);
  if (options?.context) parts.push(`[${options.context}]`);
  parts.push(message);
  return parts.join(" ");
};

/**
 * Debug level logging - only in development
 */
export const logDebug = (message: string, data?: unknown, options?: LogOptions): void => {
  if (!isDev) return;
  const formatted = formatMessage(message, options);
  if (data !== undefined) {
    console.log(formatted, data);
  } else {
    console.log(formatted);
  }
};

/**
 * Info level logging - only in development
 */
export const logInfo = (message: string, data?: unknown, options?: LogOptions): void => {
  if (!isDev) return;
  const formatted = formatMessage(message, options);
  if (data !== undefined) {
    console.info(formatted, data);
  } else {
    console.info(formatted);
  }
};

/**
 * Warning level logging - always logs
 */
export const logWarn = (message: string, data?: unknown, options?: LogOptions): void => {
  const formatted = formatMessage(message, options);
  if (data !== undefined) {
    console.warn(formatted, data);
  } else {
    console.warn(formatted);
  }
};

/**
 * Error level logging - always logs
 */
export const logError = (message: string, error?: unknown, options?: LogOptions): void => {
  const formatted = formatMessage(message, options);
  if (error !== undefined) {
    console.error(formatted, error);
  } else {
    console.error(formatted);
  }
};

/**
 * Voice-related logging
 */
export const logVoice = (message: string, data?: unknown): void => {
  logDebug(message, data, { emoji: "🎤", context: "Voice" });
};

/**
 * Dashboard-related logging
 */
export const logDashboard = (message: string, data?: unknown): void => {
  logDebug(message, data, { emoji: "📊", context: "Dashboard" });
};

/**
 * Form-related logging
 */
export const logForm = (message: string, data?: unknown): void => {
  logDebug(message, data, { emoji: "📝", context: "Form" });
};

/**
 * Auth-related logging
 */
export const logAuth = (message: string, data?: unknown): void => {
  logDebug(message, data, { emoji: "🔐", context: "Auth" });
};

/**
 * Storage-related logging
 */
export const logStorage = (message: string, data?: unknown): void => {
  logDebug(message, data, { emoji: "💾", context: "Storage" });
};

/**
 * Print-related logging
 */
export const logPrint = (message: string, data?: unknown): void => {
  logDebug(message, data, { emoji: "🖨️", context: "Print" });
};

// Default export for convenience
const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  voice: logVoice,
  dashboard: logDashboard,
  form: logForm,
  auth: logAuth,
  storage: logStorage,
  print: logPrint,
};

export default logger;
