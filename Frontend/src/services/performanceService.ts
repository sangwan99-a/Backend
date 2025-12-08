/**
 * Performance monitoring and telemetry for FusionDesk
 * Tracks usage patterns, module adoption, and performance metrics
 */

const log = { info: console.log, error: console.error };

interface PerformanceMetric {
  timestamp: number;
  module: string;
  metric: string;
  value: number | string | boolean;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalMetrics: number;
  moduleMetrics: Record<string, number>;
  lastSync: number;
}

export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private stats: PerformanceStats = {
    totalMetrics: 0,
    moduleMetrics: {},
    lastSync: 0,
  };

  private readonly MAX_METRICS = 1000;
  private readonly SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.initializeTelemetry();
  }

  /**
   * Initialize telemetry system
   */
  private initializeTelemetry(): void {
    // Sync metrics periodically
    setInterval(() => {
      this.syncMetrics();
    }, this.SYNC_INTERVAL);

    log.info('Performance telemetry initialized');
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    module: string,
    metric: string,
    value: number | string | boolean,
    metadata?: Record<string, any>
  ): void {
    this.metrics.push({
      timestamp: Date.now(),
      module,
      metric,
      value,
      metadata,
    });

    // Update stats
    this.stats.totalMetrics++;
    if (!this.stats.moduleMetrics[module]) {
      this.stats.moduleMetrics[module] = 0;
    }
    this.stats.moduleMetrics[module]++;

    // Trim old metrics if exceeding limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Record page view
   */
  public recordPageView(page: string, metadata?: Record<string, any>): void {
    this.recordMetric('navigation', 'page-view', page, metadata);
  }

  /**
   * Record API call
   */
  public recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): void {
    this.recordMetric('api', `${method} ${endpoint}`, statusCode, {
      duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Record error
   */
  public recordError(module: string, error: Error, context?: Record<string, any>): void {
    this.recordMetric('error', module, error.message, {
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Record module load
   */
  public recordModuleLoad(module: string, duration: number): void {
    this.recordMetric('module', `${module}-load`, duration, {
      timestamp: Date.now(),
    });
  }

  /**
   * Record memory usage
   */
  public recordMemoryUsage(): void {
    if (process.memoryUsage) {
      const usage = process.memoryUsage();
      this.recordMetric('performance', 'memory-heap-used', usage.heapUsed, {
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
      });
    }
  }

  /**
   * Record render time
   */
  public recordRenderTime(component: string, duration: number): void {
    this.recordMetric('performance', `render-${component}`, duration);
  }

  /**
   * Get metrics summary
   */
  public getSummary(): PerformanceStats {
    return {
      totalMetrics: this.stats.totalMetrics,
      moduleMetrics: { ...this.stats.moduleMetrics },
      lastSync: this.stats.lastSync,
    };
  }

  /**
   * Get metrics by module
   */
  public getMetricsByModule(module: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.module === module);
  }

  /**
   * Get metrics by type
   */
  public getMetricsByType(metric: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.metric === metric);
  }

  /**
   * Sync metrics to server
   */
  private async syncMetrics(): Promise<void> {
    try {
      if (this.metrics.length === 0) {
        return;
      }

      // TODO: Implement server-side telemetry collection
      // await fetch('/api/telemetry/metrics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     timestamp: Date.now(),
      //     metrics: this.metrics,
      //     stats: this.stats,
      //   }),
      // });

      log.info(`Synced ${this.metrics.length} performance metrics`);
      this.stats.lastSync = Date.now();

      // Clear synced metrics
      this.metrics = [];
    } catch (error) {
      log.error('Failed to sync metrics:', error);
    }
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): {
    metrics: PerformanceMetric[];
    stats: PerformanceStats;
    exportTime: number;
  } {
    return {
      metrics: [...this.metrics],
      stats: this.getSummary(),
      exportTime: Date.now(),
    };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.stats = {
      totalMetrics: 0,
      moduleMetrics: {},
      lastSync: this.stats.lastSync,
    };
    log.info('Performance metrics cleared');
  }
}

// Singleton instance
let instance: PerformanceService;

export const getPerformanceService = (): PerformanceService => {
  if (!instance) {
    instance = new PerformanceService();
  }
  return instance;
};

export default PerformanceService;
