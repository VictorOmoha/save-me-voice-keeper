interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'voice' | 'form' | 'api' | 'render';
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, number> = new Map();
  private maxMetrics = 500;
  private isEnabled = true;

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  startTimer(name: string, type: PerformanceMetric['type'], context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    this.activeTimers.set(name, startTime);
    
    if (import.meta.env.DEV) {
      console.time(`[PERF] ${name}`);
    }
  }

  endTimer(name: string, type: PerformanceMetric['type'], context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const startTime = this.activeTimers.get(name);
    if (!startTime) {
      console.warn(`Performance timer \"${name}\" not found`);
      return;
    }

    const duration = performance.now() - startTime;
    this.activeTimers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      type,
      context
    };

    this.addMetric(metric);

    if (import.meta.env.DEV) {
      console.timeEnd(`[PERF] ${name}`);
      if (duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(type?: PerformanceMetric['type']): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (type) {
      filteredMetrics = filteredMetrics.filter(metric => metric.type === type);
    }

    return filteredMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  getStats(type?: PerformanceMetric['type']) {
    const metrics = this.getMetrics(type);
    
    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        slowOperations: []
      };
    }

    const durations = metrics.map(m => m.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const slowOperations = metrics
      .filter(m => m.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      count: metrics.length,
      avgDuration: Math.round(avgDuration * 100) / 100,
      minDuration: Math.round(minDuration * 100) / 100,
      maxDuration: Math.round(maxDuration * 100) / 100,
      slowOperations
    };
  }

  clear() {
    this.metrics = [];
    this.activeTimers.clear();
  }

  // Helper methods for common operations
  measureVoiceProcessing<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.measureAsync(name, 'voice', fn);
  }

  measureFormOperation<T>(name: string, fn: () => T): T {
    return this.measureSync(name, 'form', fn);
  }

  measureApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.measureAsync(name, 'api', fn);
  }

  private measureSync<T>(name: string, type: PerformanceMetric['type'], fn: () => T): T {
    this.startTimer(name, type);
    try {
      const result = fn();
      this.endTimer(name, type);
      return result;
    } catch (error) {
      this.endTimer(name, type, { error: true });
      throw error;
    }
  }

  private async measureAsync<T>(name: string, type: PerformanceMetric['type'], fn: () => Promise<T>): Promise<T> {
    this.startTimer(name, type);
    try {
      const result = await fn();
      this.endTimer(name, type);
      return result;
    } catch (error) {
      this.endTimer(name, type, { error: true });
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
