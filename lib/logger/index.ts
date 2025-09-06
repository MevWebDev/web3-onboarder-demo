// Client-safe logger that works in both server and browser environments

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private enableConsole: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.enableConsole = process.env.ENABLE_CONSOLE_LOGS === 'true' || true;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private writeToConsole(entry: LogEntry) {
    if (!this.enableConsole) return;

    const { level, message, data } = entry;
    const timestamp = new Date().toISOString();
    
    // Use browser console or Node console based on environment
    if (typeof window !== 'undefined') {
      // Browser environment
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(`${prefix} ${message}`, data || '');
          break;
        case 'info':
          console.info(`${prefix} ${message}`, data || '');
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`, data || '');
          break;
        case 'error':
          console.error(`${prefix} ${message}`, data || '');
          if (entry.stack) {
            console.error(entry.stack);
          }
          break;
        default:
          console.log(`${prefix} ${message}`, data || '');
      }
    } else {
      // Node environment
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        reset: '\x1b[0m',
      };

      const color = colors[level] || colors.reset;
      const prefix = `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset}`;
      
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
      
      if (entry.stack) {
        console.error(entry.stack);
      }
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // Add stack trace for errors
    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack;
    }

    // Always write to console
    this.writeToConsole(entry);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    this.log('error', message, error);
  }

  // Special method for API requests
  logApiRequest(method: string, url: string, data?: any) {
    this.info(`API Request: ${method} ${url}`, data);
  }

  // Special method for API responses
  logApiResponse(method: string, url: string, status: number, data?: any) {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API Response: ${method} ${url} - Status: ${status}`, data);
  }

  // Close method (no-op for client)
  close() {
    // No-op for client-side
  }
}

// Create singleton instance
export const logger = new Logger();