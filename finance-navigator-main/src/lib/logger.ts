export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  error?: Error;
}

function formatLog(context: LogContext): string {
  const { timestamp, level, message, data, error } = context;
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const msg = message;
  const extra = data ? ` | ${JSON.stringify(data)}` : '';
  const err = error ? ` | Error: ${error.message}` : '';
  return `${prefix} ${msg}${extra}${err}`;
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      const log = formatLog({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        data,
      });
      console.debug(log);
    }
  },

  info: (message: string, data?: unknown) => {
    const log = formatLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
    });
    console.info(log);
  },

  warn: (message: string, data?: unknown) => {
    const log = formatLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
    });
    console.warn(log);
  },

  error: (message: string, error?: Error | unknown, data?: unknown) => {
    const isError = error instanceof Error;
    const log = formatLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data,
      error: isError ? error : undefined,
    });
    console.error(log);
    if (!isError && error) {
      console.error('Additional error context:', error);
    }
    // TODO: Send to Sentry/error tracking service later
  },
};
