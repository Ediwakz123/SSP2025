/**
 * Structured Logger for Backend
 * Production-ready logging with log levels and structured output
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LOG_COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  http: '\x1b[35m',  // Magenta
  debug: '\x1b[37m', // White
  reset: '\x1b[0m',
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.enableColors = process.env.NODE_ENV !== 'production';
  }

  /**
   * Check if a log level should be output
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  /**
   * Format log entry as JSON for production, pretty for development
   */
  formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logEntry);
    }

    // Pretty format for development
    const color = this.enableColors ? LOG_COLORS[level] : '';
    const reset = this.enableColors ? LOG_COLORS.reset : '';
    const levelPadded = level.toUpperCase().padEnd(5);
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    return `${color}[${timestamp}] ${levelPadded}${reset}: ${message}${metaStr}`;
  }

  /**
   * Log an error message
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message, meta));
    }
  }

  /**
   * Log a warning message
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, meta));
    }
  }

  /**
   * Log an info message
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('info', message, meta));
    }
  }

  /**
   * Log an HTTP request
   */
  http(message, meta = {}) {
    if (this.shouldLog('http')) {
      console.log(this.formatLog('http', message, meta));
    }
  }

  /**
   * Log a debug message
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, meta));
    }
  }

  /**
   * Create Express middleware for request logging
   */
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.http(`${req.method} ${req.originalUrl}`, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')?.substring(0, 100),
        });
      });
      
      next();
    };
  }
}

export const logger = new Logger();
export default logger;
