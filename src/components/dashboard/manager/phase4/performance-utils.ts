// Performance optimization utilities for the manager dashboard
import React, { lazy, ComponentType } from 'react';
import { toast } from 'sonner';

// Lazy loading with error boundaries
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType<any>
) => {
  return lazy(() =>
    importFn().catch((error) => {
      console.error('Failed to load component:', error);
      toast.error('Failed to load component. Please refresh the page.');

      // Return a fallback component or empty component
      return fallback
        ? { default: fallback }
        : {
            default: () =>
              React.createElement('div', null, 'Component failed to load')
          };
    })
  );
};

// Preload critical components
export const preloadComponents = async () => {
  try {
    // Preload Phase 2 components that might be needed
    await Promise.all([
      import('../phase2/enhanced-ticket-creation'),
      import('../phase2/quick-assignment'),
      import('../phase2/smart-media-upload')
    ]);
  } catch (error) {
    console.warn('Failed to preload some components:', error);
  }
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, defaultOptions);
  }

  return null;
};

// Debounce function for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

// Memory management for large lists
export const createVirtualizedList = (
  items: any[],
  containerHeight: number,
  itemHeight: number,
  overscan = 5
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  return {
    totalHeight,
    visibleCount,
    overscan,
    getVisibleItems: (scrollTop: number) => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + visibleCount + overscan,
        items.length
      );

      return {
        startIndex: Math.max(0, startIndex - overscan),
        endIndex,
        items: items.slice(Math.max(0, startIndex - overscan), endIndex)
      };
    }
  };
};

// Cache management
class CacheManager {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private maxSize = 100;

  set(key: string, data: any, ttl = 5 * 60 * 1000) {
    // 5 minutes default
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

export const cacheManager = new CacheManager();

// Bundle size analyzer helper
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in production build');
    return;
  }

  // This would integrate with webpack-bundle-analyzer or similar
  console.log('Bundle size analysis would run here in production');
};

// Image optimization
export const optimizeImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Performance monitoring
export const performanceMonitor = {
  startTiming: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${label}-start`);
    }
  },

  endTiming: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const measure = performance.getEntriesByName(label)[0];
      if (measure && measure.duration > 1000) {
        console.warn(
          `Performance: ${label} took ${measure.duration.toFixed(2)}ms`
        );
      }

      // Clean up marks
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    }
  }
};

// Error boundary helper
export const createErrorBoundary = (fallback: ComponentType<any>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component error:', error, errorInfo);
      toast.error('Something went wrong. Please try refreshing the page.');
    }

    render() {
      if (this.state.hasError) {
        return React.createElement(fallback, { error: this.state.error });
      }

      return this.props.children;
    }
  };
};
