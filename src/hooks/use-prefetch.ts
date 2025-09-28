// E-Wheels Performance Optimization: Intelligent Prefetching Strategies
// Phase 4: Full React Query Integration - Smart Data Prefetching

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { cachedKpiService } from '@/lib/api/cache-layer';
import { supabaseBatteryRepository } from '@/lib/api/batteries.supabase';
import { dashboardKeys } from './use-dashboard-data';
import { batteryKeys, type BatteryFilters } from './use-batteries';
import { startPerformanceTrace, endPerformanceTrace } from '@/lib/performance/monitor';

/**
 * Hook for hover-based prefetching
 * Prefetches data when user hovers over interactive elements
 */
export function useHoverPrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchBattery = React.useCallback(async (batteryId: string) => {
    if (!batteryId) return;
    
    const traceId = startPerformanceTrace('hover_prefetch_battery');
    
    try {
      await queryClient.prefetchQuery({
        queryKey: batteryKeys.detail(batteryId),
        queryFn: async () => {
          const result = await supabaseBatteryRepository.fetchBattery(batteryId);
          if (!result.success) throw new Error(result.error);
          return result.data!;
        },
        staleTime: 30 * 1000, // 30 seconds
      });
      
      endPerformanceTrace(traceId, 'success', {
        batteryId,
        trigger: 'hover'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [queryClient]);
  
  const prefetchBatteries = React.useCallback(async (filters: BatteryFilters = {}) => {
    const traceId = startPerformanceTrace('hover_prefetch_batteries');
    
    try {
      await queryClient.prefetchQuery({
        queryKey: batteryKeys.summary(filters),
        queryFn: async () => {
          const result = await cachedKpiService.fetchBatterySummaries(filters);
          if (!result.success) throw new Error(result.error);
          return result.data!;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
      });
      
      endPerformanceTrace(traceId, 'success', {
        filters,
        trigger: 'hover'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [queryClient]);
  
  const prefetchDashboard = React.useCallback(async () => {
    const traceId = startPerformanceTrace('hover_prefetch_dashboard');
    
    try {
      await queryClient.prefetchQuery({
        queryKey: dashboardKeys.bundle(),
        queryFn: async () => {
          const result = await cachedKpiService.fetchDashboardBundle();
          if (!result.success) throw new Error(result.error);
          return result.data!;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
      
      endPerformanceTrace(traceId, 'success', {
        trigger: 'hover'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [queryClient]);
  
  return {
    prefetchBattery,
    prefetchBatteries,
    prefetchDashboard
  };
}

/**
 * Hook for route-based prefetching
 * Prefetches data based on likely next routes
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Prefetch data when user is likely to navigate to specific routes
  const prefetchForRoute = React.useCallback(async (route: string) => {
    const traceId = startPerformanceTrace('route_prefetch');
    
    try {
      switch (route) {
        case '/dashboard':
          // Prefetch dashboard bundle
          await queryClient.prefetchQuery({
            queryKey: dashboardKeys.bundle(),
            queryFn: async () => {
              const result = await cachedKpiService.fetchDashboardBundle();
              if (!result.success) throw new Error(result.error);
              return result.data!;
            },
            staleTime: 2 * 60 * 1000,
          });
          break;
          
        case '/dashboard/batteries':
          // Prefetch battery summaries
          await queryClient.prefetchQuery({
            queryKey: batteryKeys.summary({}),
            queryFn: async () => {
              const result = await cachedKpiService.fetchBatterySummaries({ limit: 20 });
              if (!result.success) throw new Error(result.error);
              return result.data!;
            },
            staleTime: 1 * 60 * 1000,
          });
          break;
          
        case '/dashboard/customers':
          // Prefetch customer summaries
          await queryClient.prefetchQuery({
            queryKey: ['customers', 'summaries'],
            queryFn: async () => {
              const result = await cachedKpiService.fetchCustomerSummaries({ limit: 20 });
              if (!result.success) throw new Error(result.error);
              return result.data!;
            },
            staleTime: 10 * 60 * 1000,
          });
          break;
      }
      
      endPerformanceTrace(traceId, 'success', {
        route,
        trigger: 'route_prediction'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [queryClient]);
  
  return { prefetchForRoute };
}

/**
 * Hook for intelligent background prefetching
 * Prefetches data based on user behavior patterns
 */
export function useIntelligentPrefetch() {
  const queryClient = useQueryClient();
  const [userPatterns, setUserPatterns] = React.useState<{
    visitedRoutes: string[];
    frequentQueries: string[];
    lastActive: Date;
  }>({
    visitedRoutes: [],
    frequentQueries: [],
    lastActive: new Date()
  });
  
  // Track user navigation patterns
  React.useEffect(() => {
    const trackNavigation = () => {
      const currentRoute = window.location.pathname;
      setUserPatterns(prev => ({
        ...prev,
        visitedRoutes: [currentRoute, ...prev.visitedRoutes.slice(0, 9)], // Keep last 10 routes
        lastActive: new Date()
      }));
    };
    
    // Track route changes
    window.addEventListener('popstate', trackNavigation);
    trackNavigation(); // Track initial route
    
    return () => window.removeEventListener('popstate', trackNavigation);
  }, []);
  
  // Intelligent prefetch based on patterns
  const smartPrefetch = React.useCallback(async () => {
    const traceId = startPerformanceTrace('intelligent_prefetch');
    
    try {
      const { visitedRoutes } = userPatterns;
      
      // If user frequently visits dashboard, prefetch dashboard data
      if (visitedRoutes.filter(r => r.includes('dashboard')).length > 2) {
        await queryClient.prefetchQuery({
          queryKey: dashboardKeys.bundle(),
          queryFn: async () => {
            const result = await cachedKpiService.fetchDashboardBundle();
            if (!result.success) throw new Error(result.error);
            return result.data!;
          },
          staleTime: 2 * 60 * 1000,
        });
      }
      
      // If user frequently visits batteries, prefetch battery data
      if (visitedRoutes.filter(r => r.includes('batteries')).length > 1) {
        await queryClient.prefetchQuery({
          queryKey: batteryKeys.summary({}),
          queryFn: async () => {
            const result = await cachedKpiService.fetchBatterySummaries({ limit: 20 });
            if (!result.success) throw new Error(result.error);
            return result.data!;
          },
          staleTime: 1 * 60 * 1000,
        });
      }
      
      endPerformanceTrace(traceId, 'success', {
        patterns: visitedRoutes.length,
        trigger: 'intelligent'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [queryClient, userPatterns]);
  
  // Run intelligent prefetch periodically
  React.useEffect(() => {
    const interval = setInterval(smartPrefetch, 60000); // Every minute
    return () => clearInterval(interval);
  }, [smartPrefetch]);
  
  return {
    userPatterns,
    smartPrefetch
  };
}

/**
 * Hook for intersection observer-based prefetching
 * Prefetches data when elements come into view
 */
export function useIntersectionPrefetch() {
  const queryClient = useQueryClient();
  
  const createPrefetchObserver = React.useCallback((
    callback: () => Promise<void>,
    options: IntersectionObserverInit = {}
  ) => {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '100px', // Prefetch when element is 100px away from viewport
      threshold: 0.1,
      ...options
    };
    
    return new IntersectionObserver(async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          try {
            await callback();
          } catch (error) {
            console.error('Intersection prefetch error:', error);
          }
        }
      }
    }, defaultOptions);
  }, []);
  
  const prefetchOnIntersect = React.useCallback((
    element: Element | null,
    prefetchFn: () => Promise<void>,
    options?: IntersectionObserverInit
  ) => {
    if (!element) return () => {};
    
    const observer = createPrefetchObserver(prefetchFn, options);
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [createPrefetchObserver]);
  
  return {
    prefetchOnIntersect,
    createPrefetchObserver
  };
}

/**
 * Hook for idle-time prefetching
 * Prefetches data during browser idle periods
 */
export function useIdlePrefetch() {
  const queryClient = useQueryClient();
  const [isIdle, setIsIdle] = React.useState(false);
  
  React.useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsIdle(true), 5000); // 5 seconds of inactivity
    };
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });
    
    resetIdleTimer(); // Initialize timer
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      clearTimeout(idleTimer);
    };
  }, []);
  
  const prefetchDuringIdle = React.useCallback(async (
    prefetchFunctions: Array<() => Promise<void>>
  ) => {
    if (!isIdle) return;
    
    const traceId = startPerformanceTrace('idle_prefetch');
    
    try {
      // Execute prefetch functions during idle time
      for (const prefetchFn of prefetchFunctions) {
        if (!isIdle) break; // Stop if user becomes active
        await prefetchFn();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between prefetches
      }
      
      endPerformanceTrace(traceId, 'success', {
        prefetchCount: prefetchFunctions.length,
        trigger: 'idle'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [isIdle]);
  
  // Auto-prefetch common data during idle time
  React.useEffect(() => {
    if (!isIdle) return;
    
    const idlePrefetches = [
      // Prefetch dashboard data
      async () => {
        await queryClient.prefetchQuery({
          queryKey: dashboardKeys.bundle(),
          queryFn: async () => {
            const result = await cachedKpiService.fetchDashboardBundle();
            if (!result.success) throw new Error(result.error);
            return result.data!;
          },
          staleTime: 2 * 60 * 1000,
        });
      },
      // Prefetch battery summaries
      async () => {
        await queryClient.prefetchQuery({
          queryKey: batteryKeys.summary({ limit: 20 }),
          queryFn: async () => {
            const result = await cachedKpiService.fetchBatterySummaries({ limit: 20 });
            if (!result.success) throw new Error(result.error);
            return result.data!;
          },
          staleTime: 1 * 60 * 1000,
        });
      }
    ];
    
    prefetchDuringIdle(idlePrefetches);
  }, [isIdle, prefetchDuringIdle, queryClient]);
  
  return {
    isIdle,
    prefetchDuringIdle
  };
}

/**
 * Master prefetch hook that combines all prefetching strategies
 */
export function useMasterPrefetch(options: {
  hover?: boolean;
  route?: boolean;
  intelligent?: boolean;
  intersection?: boolean;
  idle?: boolean;
} = {}) {
  const {
    hover = true,
    route = true,
    intelligent = true,
    intersection = true,
    idle = true
  } = options;
  
  const hoverPrefetch = useHoverPrefetch();
  const routePrefetch = useRoutePrefetch();
  const intelligentPrefetch = useIntelligentPrefetch();
  const intersectionPrefetch = useIntersectionPrefetch();
  const idlePrefetch = useIdlePrefetch();
  
  return {
    // Individual strategies
    hover: hover ? hoverPrefetch : null,
    route: route ? routePrefetch : null,
    intelligent: intelligent ? intelligentPrefetch : null,
    intersection: intersection ? intersectionPrefetch : null,
    idle: idle ? idlePrefetch : null,
    
    // Convenience methods
    prefetchForBatteryHover: hoverPrefetch.prefetchBattery,
    prefetchForRouteChange: routePrefetch.prefetchForRoute,
    
    // Status
    isIdle: idle ? idlePrefetch.isIdle : false,
    userPatterns: intelligent ? intelligentPrefetch.userPatterns : null
  };
}

/**
 * React component wrapper for hover-based prefetching
 */
export interface PrefetchOnHoverProps {
  children: React.ReactElement;
  prefetch: () => Promise<void>;
  delay?: number;
}

export function PrefetchOnHover({ children, prefetch, delay = 300 }: PrefetchOnHoverProps) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(prefetch, delay);
  }, [prefetch, delay]);
  
  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  return React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ...(children.props as any)
  });
}
