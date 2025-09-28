// E-Wheels Performance Optimization: Battery React Query Hooks
// Phase 4: Full React Query Integration - Battery Operations

import React from 'react';
import { useQuery, useMutation, useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { cachedKpiService, CacheManager } from '@/lib/api/cache-layer';
import { supabaseBatteryRepository } from '@/lib/api/batteries.supabase';
import type { BatterySummary, ApiResponse } from '@/lib/api/optimized-kpis';
import type { BatteryRecord, BatteryStatus } from '@/types/bms';
import { startPerformanceTrace, endPerformanceTrace } from '@/lib/performance/monitor';
import { dashboardKeys } from './use-dashboard-data';

/**
 * Query keys for battery-related React Query cache management
 */
export const batteryKeys = {
  all: ['batteries'] as const,
  lists: () => [...batteryKeys.all, 'list'] as const,
  list: (filters: BatteryFilters) => [...batteryKeys.lists(), filters] as const,
  details: () => [...batteryKeys.all, 'detail'] as const,
  detail: (id: string) => [...batteryKeys.details(), id] as const,
  summaries: () => [...batteryKeys.all, 'summaries'] as const,
  summary: (filters: BatteryFilters) => [...batteryKeys.summaries(), filters] as const,
  diagnostics: (id: string) => [...batteryKeys.all, 'diagnostics', id] as const,
  history: (id: string) => [...batteryKeys.all, 'history', id] as const,
} as const;

/**
 * Battery filter parameters
 */
export interface BatteryFilters {
  search?: string;
  status?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}

/**
 * Infinite query page structure
 */
export interface BatteryPage {
  data: BatterySummary[];
  nextOffset?: number;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Hook for fetching battery summaries with caching
 * Supports filtering and search with optimized performance
 */
export function useBatteries(filters: BatteryFilters = {}) {
  return useQuery({
    queryKey: batteryKeys.summary(filters),
    queryFn: async () => {
      const traceId = startPerformanceTrace('batteries_query');
      
      try {
        const result = await cachedKpiService.fetchBatterySummaries(filters);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch battery data');
        }
        
        endPerformanceTrace(traceId, 'success', {
          cached: true,
          recordCount: result.data!.length,
          filters: Object.keys(filters).length
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - battery data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
    enabled: true,
  });
}

/**
 * Hook for infinite scrolling battery list
 * Efficiently loads batteries in pages with smooth UX
 */
export function useBatteriesInfinite(filters: Omit<BatteryFilters, 'offset'> = {}) {
  const pageSize = filters.limit || 20;
  
  return useInfiniteQuery({
    queryKey: batteryKeys.list(filters),
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const traceId = startPerformanceTrace('batteries_infinite_query');
      
      try {
        const result = await cachedKpiService.fetchBatterySummaries({
          ...filters,
          limit: pageSize,
          offset: pageParam,
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch battery data');
        }
        
        const data = result.data!;
        const hasMore = data.length === pageSize;
        const nextOffset = hasMore ? pageParam + pageSize : undefined;
        
        endPerformanceTrace(traceId, 'success', {
          cached: true,
          recordCount: data.length,
          pageParam,
          hasMore
        });
        
        return {
          data,
          nextOffset,
          hasMore,
          totalCount: data.length
        } as BatteryPage;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook for fetching individual battery details
 * Includes diagnostics and status history
 */
export function useBattery(batteryId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: batteryKeys.detail(batteryId),
    queryFn: async () => {
      const traceId = startPerformanceTrace('battery_detail_query');
      
      try {
        const result = await supabaseBatteryRepository.fetchBattery(batteryId);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch battery details');
        }
        
        endPerformanceTrace(traceId, 'success', {
          batteryId,
          hasData: !!result.data
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    enabled: enabled && !!batteryId,
    staleTime: 30 * 1000, // 30 seconds - individual battery data changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for creating a new battery with optimistic updates
 * Provides immediate UI feedback while the server processes the request
 */
export function useCreateBattery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batteryData: any) => {
      const traceId = startPerformanceTrace('battery_create_mutation');
      
      try {
        const result = await supabaseBatteryRepository.createBattery(batteryData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create battery');
        }
        
        endPerformanceTrace(traceId, 'success', {
          batteryId: result.data!.id,
          operation: 'create'
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    
    // Optimistic update
    onMutate: async (newBattery) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: batteryKeys.summaries() });
      
      // Generate optimistic ID
      const optimisticId = `temp-${Date.now()}`;
      const optimisticBattery: BatterySummary = {
        id: optimisticId,
        serial_number: newBattery.serial_number,
        brand: newBattery.brand,
        model: newBattery.model,
        customer_name: 'Loading...',
        customer_contact: '',
        status: 'received',
        status_category: 'pending',
        days_since_received: 0,
        delivery_status: 'in_progress',
        estimated_cost: newBattery.estimated_cost,
        final_cost: null,
        received_date: new Date().toISOString(),
        delivered_date: null,
        location_id: 'default'
      };
      
      // Optimistically update all relevant queries
      queryClient.setQueryData(
        batteryKeys.summary({}),
        (old: BatterySummary[] | undefined) => {
          if (!old) return [optimisticBattery];
          return [optimisticBattery, ...old];
        }
      );
      
      return { optimisticId, optimisticBattery };
    },
    
    onSuccess: (data, variables, context) => {
      // Replace optimistic data with real data
      if (context?.optimisticId) {
        queryClient.setQueryData(
          batteryKeys.summary({}),
          (old: BatterySummary[] | undefined) => {
            if (!old) return [data as any];
            return old.map(battery => 
              battery.id === context.optimisticId ? (data as any) : battery
            );
          }
        );
      }
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      
      // Invalidate server-side cache
      CacheManager.invalidateBatteries();
    },
    
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.optimisticId) {
        queryClient.setQueryData(
          batteryKeys.summary({}),
          (old: BatterySummary[] | undefined) => {
            if (!old) return [];
            return old.filter(battery => battery.id !== context.optimisticId);
          }
        );
      }
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
    }
  });
}

/**
 * Hook for updating battery status with optimistic updates
 * Provides immediate feedback for status changes
 */
export function useUpdateBatteryStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      batteryId, 
      newStatus, 
      notes 
    }: { 
      batteryId: string; 
      newStatus: BatteryStatus; 
      notes?: string; 
    }) => {
      const traceId = startPerformanceTrace('battery_status_update_mutation');
      
      try {
        const result = await supabaseBatteryRepository.updateBatteryStatus(batteryId, newStatus, notes);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update battery status');
        }
        
        endPerformanceTrace(traceId, 'success', {
          batteryId,
          newStatus,
          operation: 'status_update'
        });
        
        return result.data!;
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    
    // Optimistic update
    onMutate: async ({ batteryId, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: batteryKeys.detail(batteryId) });
      await queryClient.cancelQueries({ queryKey: batteryKeys.summaries() });
      
      // Store previous values for rollback
      const previousDetail = queryClient.getQueryData(batteryKeys.detail(batteryId));
      const previousSummaries = queryClient.getQueryData(batteryKeys.summary({}));
      
      // Optimistically update battery detail
      queryClient.setQueryData(
        batteryKeys.detail(batteryId),
        (old: BatteryRecord | undefined) => {
          if (!old) return old;
          return { ...old, status: newStatus, updated_at: new Date().toISOString() };
        }
      );
      
      // Optimistically update battery summaries
      queryClient.setQueryData(
        batteryKeys.summary({}),
        (old: BatterySummary[] | undefined) => {
          if (!old) return old;
          return old.map(battery => 
            battery.id === batteryId 
              ? { 
                  ...battery, 
                  status: newStatus,
                  status_category: ['completed', 'delivered'].includes(newStatus) ? 'completed' as const : 'pending' as const,
                  delivery_status: newStatus === 'delivered' ? 'delivered' as const : 
                                 newStatus === 'completed' ? 'ready' as const : 'in_progress' as const
                }
              : battery
          );
        }
      );
      
      return { previousDetail, previousSummaries };
    },
    
    onSuccess: (data, variables) => {
      // Update with real data
      queryClient.setQueryData(batteryKeys.detail(variables.batteryId), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: batteryKeys.history(variables.batteryId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      
      // Invalidate server-side cache
      CacheManager.invalidateBatteries();
    },
    
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousDetail) {
        queryClient.setQueryData(batteryKeys.detail(variables.batteryId), context.previousDetail);
      }
      if (context?.previousSummaries) {
        queryClient.setQueryData(batteryKeys.summary({}), context.previousSummaries);
      }
    }
  });
}

/**
 * Hook for prefetching battery data
 * Useful for hover states and route preloading
 */
export function usePrefetchBattery() {
  const queryClient = useQueryClient();
  
  const prefetchBattery = async (batteryId: string) => {
    await queryClient.prefetchQuery({
      queryKey: batteryKeys.detail(batteryId),
      queryFn: async () => {
        const result = await supabaseBatteryRepository.fetchBattery(batteryId);
        if (!result.success) throw new Error(result.error);
        return result.data!;
      },
      staleTime: 30 * 1000,
    });
  };
  
  const prefetchBatteries = async (filters: BatteryFilters = {}) => {
    await queryClient.prefetchQuery({
      queryKey: batteryKeys.summary(filters),
      queryFn: async () => {
        const result = await cachedKpiService.fetchBatterySummaries(filters);
        if (!result.success) throw new Error(result.error);
        return result.data!;
      },
      staleTime: 1 * 60 * 1000,
    });
  };
  
  return {
    prefetchBattery,
    prefetchBatteries
  };
}

/**
 * Hook for battery search with debouncing
 * Optimizes search queries to reduce unnecessary API calls
 */
export function useBatterySearch(searchTerm: string, debounceMs: number = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);
  
  return useBatteries({
    search: debouncedSearchTerm,
    limit: 20
  });
}

/**
 * Composite hook for battery management
 * Provides all battery-related functionality in one place
 */
export function useBatteryManagement() {
  const createBattery = useCreateBattery();
  const updateStatus = useUpdateBatteryStatus();
  const prefetch = usePrefetchBattery();
  
  return {
    // Mutations
    createBattery: createBattery.mutate,
    isCreating: createBattery.isPending,
    createError: createBattery.error,
    
    updateStatus: updateStatus.mutate,
    isUpdatingStatus: updateStatus.isPending,
    updateError: updateStatus.error,
    
    // Prefetching
    prefetch,
    
    // Reset functions
    resetCreateError: createBattery.reset,
    resetUpdateError: updateStatus.reset,
  };
}
