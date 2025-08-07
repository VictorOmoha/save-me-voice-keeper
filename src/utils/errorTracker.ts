interface ErrorLog {
  timestamp: number;
  type: 'voice' | 'form' | 'api' | 'ui';
  level: 'error' | 'warning' | 'info';
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorTracker {
  private logs: ErrorLog[] = [];
  private maxLogs = 1000;
  private isEnabled = true;

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  logError(type: ErrorLog['type'], message: string, context?: Record<string, any>, error?: Error) {
    if (!this.isEnabled) return;

    const errorLog: ErrorLog = {
      timestamp: Date.now(),
      type,
      level: 'error',
      message,
      context,
      stack: error?.stack
    };

    this.addLog(errorLog);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${type.toUpperCase()}] ${message}`, context, error);
    }
  }

  logWarning(type: ErrorLog['type'], message: string, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const warningLog: ErrorLog = {
      timestamp: Date.now(),
      type,
      level: 'warning',
      message,
      context
    };

    this.addLog(warningLog);
    
    if (import.meta.env.DEV) {
      console.warn(`[${type.toUpperCase()}] ${message}`, context);
    }
  }

  logInfo(type: ErrorLog['type'], message: string, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const infoLog: ErrorLog = {
      timestamp: Date.now(),
      type,
      level: 'info',
      message,
      context
    };

    this.addLog(infoLog);
    
    if (import.meta.env.DEV) {
      console.info(`[${type.toUpperCase()}] ${message}`, context);
    }
  }

  private addLog(log: ErrorLog) {
    this.logs.push(log);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(type?: ErrorLog['type'], level?: ErrorLog['level']): ErrorLog[] {
    let filteredLogs = this.logs;

    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getStats() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const recent = this.logs.filter(log => log.timestamp > last24Hours);

    return {
      total: this.logs.length,
      last24Hours: recent.length,
      byType: {
        voice: recent.filter(log => log.type === 'voice').length,
        form: recent.filter(log => log.type === 'form').length,
        api: recent.filter(log => log.type === 'api').length,
        ui: recent.filter(log => log.type === 'ui').length,
      },
      byLevel: {
        error: recent.filter(log => log.level === 'error').length,
        warning: recent.filter(log => log.level === 'warning').length,
        info: recent.filter(log => log.level === 'info').length,
      }
    };
  }

  clear() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

export const errorTracker = new ErrorTracker();
