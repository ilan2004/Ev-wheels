// Performance monitoring utilities for E-Wheels optimization
export const measureApiCall = async <T>(
  queryKey: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (process.env.NODE_ENV === 'development') {
    const duration = (end - start).toFixed(2);
    const color =
      parseFloat(duration) < 100
        ? '🟢'
        : parseFloat(duration) < 500
          ? '🟡'
          : '🔴';
    console.log(`${color} API: ${queryKey} completed in ${duration}ms`);
  }

  return result;
};

export const measureRender = (componentName: string) => {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = (end - start).toFixed(2);

    if (process.env.NODE_ENV === 'development') {
      const color =
        parseFloat(duration) < 16
          ? '🟢'
          : parseFloat(duration) < 33
            ? '🟡'
            : '🔴';
      console.log(`${color} Render: ${componentName} took ${duration}ms`);
    }
  };
};

export const startPerformanceTrace = (traceName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`⏱️ Performance Trace: ${traceName} started`);
  }
  return performance.now();
};

export const endPerformanceTrace = (
  traceId: number,
  status?: string,
  metadata?: any
) => {
  if (process.env.NODE_ENV === 'development') {
    const end = performance.now();
    const duration = (end - traceId).toFixed(2);
    const color =
      parseFloat(duration) < 100
        ? '🟢'
        : parseFloat(duration) < 500
          ? '🟡'
          : '🔴';
    const statusText = status ? ` (${status})` : '';
    const metaText = metadata ? ` - ${JSON.stringify(metadata)}` : '';
    console.log(
      `${color} Performance Trace ended in ${duration}ms${statusText}${metaText}`
    );
  }
};

// Web Vitals monitoring function
export const reportWebVitals = (metric: {
  name: string;
  value: number;
  delta: number;
  id: string;
}) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, you can send these to your analytics service
    // Example: analytics.track('Web Vital', { name: metric.name, value: metric.value });
    console.log('📊 Web Vital:', metric.name, metric.value);
  } else {
    // In development, log to console for debugging
    const color = getMetricColor(metric.name, metric.value);
    console.log(`${color} ${metric.name}: ${metric.value.toFixed(2)}ms`);
  }
};

// Get color based on Core Web Vitals thresholds
function getMetricColor(name: string, value: number): string {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 }
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return '🔵';

  if (value <= threshold.good) return '🟢';
  if (value <= threshold.poor) return '🟡';
  return '🔴';
}

// Query performance tracker for React Query
export const trackQueryPerformance = (queryKey: string[], duration: number) => {
  if (process.env.NODE_ENV === 'development') {
    const key = queryKey.join('.');
    const color = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
    console.log(`${color} Query: ${key} - ${duration.toFixed(2)}ms`);
  }
};

// Cache performance metrics
export const getCacheStats = (queryClient: any) => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  const stats = {
    totalQueries: queries.length,
    activeQueries: queries.filter((q: any) => q.getObserversCount() > 0).length,
    staleQueries: queries.filter((q: any) => q.isStale()).length,
    cacheSize: queries.reduce((size: number, query: any) => {
      return size + (JSON.stringify(query.state.data)?.length || 0);
    }, 0)
  };

  if (process.env.NODE_ENV === 'development') {
    console.table({
      'Total Queries': stats.totalQueries,
      'Active Queries': stats.activeQueries,
      'Stale Queries': stats.staleQueries,
      'Cache Size (bytes)': stats.cacheSize.toLocaleString()
    });
  }

  return stats;
};
