/**
 * @fileoverview Logging System
 * 
 * Provides structured logging with in-memory storage for debugging.
 * All logs are accessible via the /api/logs endpoint and displayed in the Dashboard UI.
 * 
 * Features:
 * - Three log levels: info, warn, error
 * - Structured context data (JSON)
 * - In-memory storage (survives for request lifetime)
 * - Automatic console output (respects Vercel environment)
 * - Retrievable via API for debugging
 * 
 * ⚠️ Important: Logs are stored in memory and will be lost on:
 * - Server restart
 * - Deployment
 * - Vercel function timeout (cold start)
 * 
 * For production logging, consider:
 * - Vercel logs (Dashboard → Logs)
 * - External logging service (Datadog, LogRocket, etc.)
 * 
 * @module lib/logger
 */

/**
 * Log severity levels
 */
type LogLevel = 'info' | 'warn' | 'error';

/**
 * Represents a single log entry
 */
interface LogEntry {
  timestamp: string;              // ISO 8601 timestamp
  level: LogLevel;                // Severity level
  message: string;                // Human-readable message
  context?: Record<string, any>;  // Additional structured data
}

/**
 * Logger interface defining available operations
 */
interface Logger {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  getLogs(): LogEntry[];
  clear(): void;
}

/**
 * In-memory log storage
 * ⚠️ Warning: Logs will be cleared on server restart
 */
let logs: LogEntry[] = [];

/**
 * Formats a log message for console output.
 * 
 * Format: TIMESTAMP [LEVEL] MESSAGE CONTEXT
 * Example: 2025-12-30T10:30:00.000Z [info] Starting rotation {"taskId": 1}
 * 
 * @param level - Log severity level
 * @param message - Log message
 * @param context - Optional context data (JSON-serialized)
 * @returns Formatted log string
 * 
 * @example
 * formatMessage('info', 'User logged in', { userId: 123 })
 * // Returns: "2025-12-30T10:30:00.000Z [info] User logged in {"userId":123}"
 */
function formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `${timestamp} [${level}] ${message}${contextStr}`;
}

/**
 * Internal function to add a log entry.
 * 
 * This function:
 * 1. Creates a log entry with timestamp
 * 2. Adds it to in-memory storage
 * 3. Outputs to console (with proper formatting)
 * 4. Respects Vercel environment for logging
 * 
 * @param level - Log severity level
 * @param message - Log message
 * @param context - Optional context data
 * 
 * @example
 * addLog('info', 'Task rotated', { taskId: 1, memberId: 15 })
 */
function addLog(level: LogLevel, message: string, context?: Record<string, any>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
  logs.push(entry);

  // Format for Vercel's logging system
  const formattedMsg = formatMessage(level, message, context);
  
  // Use Vercel's logging system if available
  if (process.env.VERCEL) {
    switch (level) {
      case 'info':
        console.log(formattedMsg);
        break;
      case 'warn':
        console.warn(formattedMsg);
        break;
      case 'error':
        console.error(formattedMsg);
        break;
    }
  } else {
    // Local development logging
    switch (level) {
      case 'info':
        console.log(formattedMsg);
        break;
      case 'warn':
        console.warn(formattedMsg);
        break;
      case 'error':
        console.error(formattedMsg);
        break;
    }
  }
}

/**
 * Global logger instance
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('Task rotated successfully', { taskId: 1 });
 * logger.warn('Holiday API unavailable, using fallback');
 * logger.error('Failed to update Edge Config', { error: err.message });
 * ```
 * 
 * @example
 * // Log with context
 * logger.info('User action', { 
 *   userId: 123, 
 *   action: 'update_assignment',
 *   timestamp: Date.now()
 * });
 * 
 * @example
 * // View all logs
 * const allLogs = logger.getLogs();
 * console.log(`Total logs: ${allLogs.length}`);
 * 
 * @example
 * // Clear logs (usually done by admin)
 * logger.clear();
 */
export const logger: Logger = {
  /**
   * Logs an informational message.
   * Use for: Normal operations, successful actions, progress updates.
   * 
   * @param message - Human-readable message
   * @param context - Optional structured data
   */
  info(message: string, context?: Record<string, any>) {
    addLog('info', message, context);
  },
  
  /**
   * Logs a warning message.
   * Use for: Recoverable errors, deprecated features, missing optional data.
   * 
   * @param message - Human-readable message
   * @param context - Optional structured data
   */
  warn(message: string, context?: Record<string, any>) {
    addLog('warn', message, context);
  },
  
  /**
   * Logs an error message.
   * Use for: Failures, exceptions, critical issues.
   * 
   * @param message - Human-readable message
   * @param context - Optional structured data (include error details)
   */
  error(message: string, context?: Record<string, any>) {
    addLog('error', message, context);
  },
  
  /**
   * Retrieves all stored log entries.
   * Returns a copy to prevent external modification.
   * 
   * @returns Array of all log entries (oldest first)
   */
  getLogs() {
    return [...logs]; // Return a copy to prevent external modification
  },
  
  /**
   * Clears all stored log entries.
   * Useful for: Admin cleanup, testing, reducing memory usage.
   * 
   * ⚠️ This cannot be undone!
   */
  clear() {
    logs = [];
  },
}; 