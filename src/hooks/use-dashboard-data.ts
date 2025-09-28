// E-Wheels Performance Optimization: Dashboard React Query Hooks
// Phase 4: Full React Query Integration

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cachedKpiService, CacheManager } from '@/lib/api/cache-layer';
import type { OptimizedKpis, WeeklyDeliveryPoint, BatterySummary, CustomerSummary } from '@/lib/api/cache-layer';
import { startPerformanceTrace, endPerformanceTrace } from '@/lib/performance/monitor';

/**
 * Query keys for React Query cache management
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
  trends: (weeks?: number) => [...dashboardKeys.all, 'trends', weeks] as const,
  bundle: () => [...dashboardKeys.all, 'bundle'] as const,
  batteries: () => [...dashboardKeys.all, 'batteries'] as const,
  customers: () => [...dashboardKeys.all, 'customers'] as const,
} as const;

/**
 * Dashboard bundle data structure
 */
export interface DashboardBundle {
  kpis: OptimizedKpis;
  weeklyTrends: WeeklyDeliveryPoint[];
  recentBatteries: BatterySummary[];
  topCustomers: CustomerSummary[];
}

/**
 * Hook for fetching complete dashboard data bundle
 * Uses the optimized cached API for maximum performance
 */
export function useDashboardBundle() {
  return useQuery({
    queryKey: dashboardKeys.bundle(),
    queryFn: async () => {
      const traceId = startPerformanceTrace('dashboard_bundle_query');
      
      try {
        const result = await cachedKpiService.fetchDashboardBundle();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }
        
        endPerformanceTrace(traceId, 'success', {
          cached: true,
          dataPoints: Object.keys(result.data!).length
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for fetching dashboard KPIs only
 * Useful for components that only need KPI data
 */
export function useDashboardKpis() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: async () => {
      const traceId = startPerformanceTrace('dashboard_kpis_query');
      
      try {
        const result = await cachedKpiService.fetchDashboardKpis();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch KPI data');
        }
        
        endPerformanceTrace(traceId, 'success', {
          cached: true,
          metrics: Object.keys(result.data!).length
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 3 * 60 * 1000, // Every 3 minutes
  });
}

/**
 * Hook for fetching weekly delivery trends
 * Supports different week ranges with intelligent caching
 */
export function useWeeklyTrends(weeks: number = 8) {
  return useQuery({
    queryKey: dashboardKeys.trends(weeks),
    queryFn: async () => {
      const traceId = startPerformanceTrace('weekly_trends_query');
      
      try {
        const result = await cachedKpiService.fetchWeeklyDeliveryTrends(weeks);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch trends data');
        }
        
        endPerformanceTrace(traceId, 'success', {
          cached: true,
          dataPoints: result.data!.length,
          weeks
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - trends change less frequently
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false, // Don't refetch trends on focus
    refetchInterval: 30 * 60 * 1000, // Every 30 minutes
  });
}

/**
 * Hook for invalidating dashboard data
 * Useful after operations that affect dashboard metrics
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (options?: { 
      invalidateServer?: boolean;
      refetchActive?: boolean;
    }) => {
      const { invalidateServer = true, refetchActive = true } = options || {};
      
      // Invalidate server-side caches
      if (invalidateServer) {
        await CacheManager.invalidateDashboard();
      }
      
      // Invalidate React Query caches
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.all
      });
      
      // Optionally refetch active queries
      if (refetchActive) {
        await queryClient.refetchQueries({
          queryKey: dashboardKeys.all,
          type: 'active'
        });
      }
    },
    onSuccess: () => {
      console.log('Dashboard data invalidated and refreshed');
    },
    onError: (error) => {
      console.error('Failed to invalidate dashboard data:', error);
    }
  });
}

/**
 * Hook for prefetching dashboard data
 * Useful for preloading data on route changes or user interactions
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();
  
  const prefetchBundle = async () => {
    await queryClient.prefetchQuery({
      queryKey: dashboardKeys.bundle(),
      queryFn: async () => {
        const result = await cachedKpiService.fetchDashboardBundle();
        if (!result.success) throw new Error(result.error);
        return result.data!;
      },
      staleTime: 2 * 60 * 1000,
    });
  };
  
  const prefetchKpis = async () => {
    await queryClient.prefetchQuery({
      queryKey: dashboardKeys.kpis(),
      queryFn: async () => {
        const result = await cachedKpiService.fetchDashboardKpis();
        if (!result.success) throw new Error(result.error);
        return result.data!;
      },
      staleTime: 3 * 60 * 1000,
    });
  };
  
  const prefetchTrends = async (weeks: number = 8) => {
    await queryClient.prefetchQuery({
      queryKey: dashboardKeys.trends(weeks),
      queryFn: async () => {
        const result = await cachedKpiService.fetchWeeklyDeliveryTrends(weeks);
        if (!result.success) throw new Error(result.error);
        return result.data!;
      },
      staleTime: 30 * 60 * 1000,
    });
  };
  
  return {
    prefetchBundle,
    prefetchKpis,
    prefetchTrends,
    prefetchAll: async () => {
      await Promise.all([
        prefetchBundle(),
        prefetchKpis(),
        prefetchTrends()
      ]);
    }
  };
}

/**
 * Hook for real-time dashboard updates
 * Provides manual refresh and auto-refresh controls
 */
export function useDashboardRefresh() {
  const queryClient = useQueryClient();
  
  const refreshAll = async () => {
    const traceId = startPerformanceTrace('dashboard_manual_refresh');
    
    try {
      await queryClient.refetchQueries({
        queryKey: dashboardKeys.all
      });
      
      endPerformanceTrace(traceId, 'success', {
        operation: 'manual_refresh'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
  
  const refreshKpis = async () => {
    await queryClient.refetchQueries({
      queryKey: dashboardKeys.kpis()
    });
  };
  
  const refreshTrends = async () => {
    await queryClient.refetchQueries({
      queryKey: dashboardKeys.trends()
    });
  };
  
  return {
    refreshAll,
    refreshKpis,
    refreshTrends
  };
}

/**
 * Composite hook that provides all dashboard functionality
 * One-stop hook for components that need multiple dashboard features
 */
export function useDashboard() {
  const bundle = useDashboardBundle();
  const invalidate = useInvalidateDashboard();
  const prefetch = usePrefetchDashboard();
  const refresh = useDashboardRefresh();
  
  return {
    // Data
    data: bundle.data,
    isLoading: bundle.isLoading,
    isError: bundle.isError,
    error: bundle.error,
    isSuccess: bundle.isSuccess,
    
    // Individual data pieces (derived from bundle)
    kpis: bundle.data?.kpis,
    trends: bundle.data?.weeklyTrends,
    recentBatteries: bundle.data?.recentBatteries,
    topCustomers: bundle.data?.topCustomers,
    
    // Cache status
    isFetching: bundle.isFetching,
    isStale: bundle.isStale,
    dataUpdatedAt: bundle.dataUpdatedAt,
    
    // Actions
    invalidate: invalidate.mutate,
    isInvalidating: invalidate.isPending,
    prefetch,
    refresh,
    
    // Refetch with loading state
    refetch: bundle.refetch
  };
}

/**
 * Custom hook for dashboard performance metrics
 * Provides insights into query performance and cache effectiveness
 */
export function useDashboardPerformance() {
  const queryClient = useQueryClient();
  
  const getQueryMetrics = () => {
    const cache = queryClient.getQueryCache();
    const dashboardQueries = cache.findAll({
      queryKey: dashboardKeys.all
    });
    
    return {
      totalQueries: dashboardQueries.length,
      activeQueries: dashboardQueries.filter(q => q.observers.length > 0).length,
      staleQueries: dashboardQueries.filter(q => q.isStale()).length,
      cacheSize: dashboardQueries.reduce((size, q) => size + JSON.stringify(q.state.data || {}).length, 0),
      lastUpdated: Math.max(...dashboardQueries.map(q => q.state.dataUpdatedAt || 0))
    };
  };
  
  return {
    getMetrics: getQueryMetrics,
    clearCache: () => queryClient.clear()
  };
}
