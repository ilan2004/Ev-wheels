// E-Wheels Performance Optimization: Real-time Data Synchronization
// Phase 4: Full React Query Integration - Real-time Updates

import React from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { dashboardKeys } from './use-dashboard-data';
import { batteryKeys } from './use-batteries';
import { CacheManager } from '@/lib/api/cache-layer';
import { startPerformanceTrace, endPerformanceTrace } from '@/lib/performance/monitor';

/**
 * Real-time event types
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T = any> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  schema: string;
  table: string;
}

/**
 * Real-time subscription status
 */
export interface RealtimeStatus {
  connected: boolean;
  subscriptions: string[];
  lastEvent?: Date;
  reconnectAttempts: number;
}

/**
 * Hook for monitoring real-time connection status
 */
export function useRealtimeStatus() {
  const [status, setStatus] = React.useState<RealtimeStatus>({
    connected: false,
    subscriptions: [],
    lastEvent: undefined,
    reconnectAttempts: 0
  });
  
  React.useEffect(() => {
    const channel = supabase.channel('connection-status');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        setStatus(prev => ({ ...prev, connected: true }));
      })
      .on('presence', { event: 'join' }, () => {
        setStatus(prev => ({ ...prev, connected: true, reconnectAttempts: 0 }));
      })
      .on('presence', { event: 'leave' }, () => {
        setStatus(prev => ({ 
          ...prev, 
          connected: false, 
          reconnectAttempts: prev.reconnectAttempts + 1 
        }));
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return status;
}

/**
 * Hook for real-time battery updates
 * Automatically updates React Query cache when battery data changes
 */
export function useRealtimeBatteries() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = React.useState<Date>();
  
  React.useEffect(() => {
    const traceId = startPerformanceTrace('realtime_batteries_setup');
    
    const channel = supabase
      .channel('battery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battery_records'
        },
        async (payload: RealtimePayload) => {
          const eventTraceId = startPerformanceTrace('realtime_battery_event');
          
          try {
            setLastUpdate(new Date());
            
            // Invalidate server-side cache
            await CacheManager.invalidateBatteries();
            
            // Handle different event types
            switch (payload.eventType) {
              case 'INSERT':
                // Invalidate battery lists to include new battery
                queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
                queryClient.invalidateQueries({ queryKey: batteryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
                break;
                
              case 'UPDATE':
                const batteryId = payload.new?.id || payload.old?.id;
                if (batteryId) {
                  // Update specific battery cache
                  queryClient.invalidateQueries({ queryKey: batteryKeys.detail(batteryId) });
                  queryClient.invalidateQueries({ queryKey: batteryKeys.history(batteryId) });
                }
                
                // Update battery lists and dashboard
                queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
                queryClient.invalidateQueries({ queryKey: batteryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
                break;
                
              case 'DELETE':
                const deletedBatteryId = payload.old?.id;
                if (deletedBatteryId) {
                  // Remove from cache
                  queryClient.removeQueries({ queryKey: batteryKeys.detail(deletedBatteryId) });
                  queryClient.removeQueries({ queryKey: batteryKeys.history(deletedBatteryId) });
                }
                
                // Update lists and dashboard
                queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
                queryClient.invalidateQueries({ queryKey: batteryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
                break;
            }
            
            endPerformanceTrace(eventTraceId, 'success', {
              eventType: payload.eventType,
              batteryId: payload.new?.id || payload.old?.id
            });
          } catch (error) {
            endPerformanceTrace(eventTraceId, 'error', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error('Error handling real-time battery update:', error);
          }
        }
      )
      .subscribe();
    
    endPerformanceTrace(traceId, 'success', {
      operation: 'realtime_setup'
    });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return { lastUpdate };
}

/**
 * Hook for real-time customer updates
 */
export function useRealtimeCustomers() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = React.useState<Date>();
  
  React.useEffect(() => {
    const channel = supabase
      .channel('customer-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        async (payload: RealtimePayload) => {
          setLastUpdate(new Date());
          
          // Invalidate server-side cache
          await CacheManager.invalidateCustomers();
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: batteryKeys.summaries() });
          queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return { lastUpdate };
}

/**
 * Hook for real-time service ticket updates
 */
export function useRealtimeServiceTickets() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = React.useState<Date>();
  
  React.useEffect(() => {
    const channel = supabase
      .channel('ticket-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_tickets'
        },
        async (payload: RealtimePayload) => {
          setLastUpdate(new Date());
          
          // Invalidate dashboard for ticket status updates
          await CacheManager.invalidateDashboard();
          queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
          queryClient.invalidateQueries({ queryKey: ['service-tickets'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return { lastUpdate };
}

/**
 * Hook for background data synchronization
 * Periodically refreshes critical data even when not actively viewed
 */
export function useBackgroundSync(options: {
  interval?: number;
  enabled?: boolean;
  tables?: string[];
} = {}) {
  const { interval = 30000, enabled = true, tables = ['battery_records', 'customers'] } = options;
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (!enabled) return;
    
    const syncData = async () => {
      const traceId = startPerformanceTrace('background_sync');
      
      try {
        // Refetch critical data in background
        await Promise.all([
          queryClient.refetchQueries({ 
            queryKey: dashboardKeys.kpis(),
            type: 'active'
          }),
          queryClient.refetchQueries({ 
            queryKey: batteryKeys.summaries(),
            type: 'active'
          })
        ]);
        
        endPerformanceTrace(traceId, 'success', {
          operation: 'background_sync',
          tables
        });
      } catch (error) {
        endPerformanceTrace(traceId, 'error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error('Background sync error:', error);
      }
    };
    
    const intervalId = setInterval(syncData, interval);
    
    return () => clearInterval(intervalId);
  }, [enabled, interval, tables, queryClient]);
}

/**
 * Hook for intelligent refresh based on page visibility
 * Pauses updates when tab is not visible, resumes with fresh data on focus
 */
export function useVisibilitySync() {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = React.useState(true);
  
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible) {
        // Tab became visible, refresh critical data
        const traceId = startPerformanceTrace('visibility_sync');
        
        Promise.all([
          queryClient.refetchQueries({ 
            queryKey: dashboardKeys.bundle(),
            type: 'active'
          }),
          queryClient.refetchQueries({ 
            queryKey: batteryKeys.summaries(),
            type: 'active'
          })
        ]).then(() => {
          endPerformanceTrace(traceId, 'success', {
            operation: 'visibility_refresh'
          });
        }).catch(error => {
          endPerformanceTrace(traceId, 'error', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);
  
  return { isVisible };
}

/**
 * Master real-time hook that sets up all real-time subscriptions
 * Use this in your root layout or main dashboard component
 */
export function useRealtimeSync(options: {
  batteries?: boolean;
  customers?: boolean;
  serviceTickets?: boolean;
  backgroundSync?: boolean;
  visibilitySync?: boolean;
} = {}) {
  const {
    batteries = true,
    customers = true,
    serviceTickets = true,
    backgroundSync = true,
    visibilitySync = true
  } = options;
  
  // Set up real-time subscriptions
  const batterySync = useRealtimeBatteries();
  const customerSync = useRealtimeCustomers();
  const ticketSync = useRealtimeServiceTickets();
  const status = useRealtimeStatus();
  
  // Set up background and visibility sync
  useBackgroundSync({ enabled: backgroundSync });
  const visibility = useVisibilitySync();
  
  return {
    status,
    lastUpdates: {
      batteries: batteries ? batterySync.lastUpdate : undefined,
      customers: customers ? customerSync.lastUpdate : undefined,
      serviceTickets: serviceTickets ? ticketSync.lastUpdate : undefined,
    },
    visibility: visibilitySync ? visibility : { isVisible: true },
    
    // Overall sync status
    isConnected: status.connected,
    lastActivity: Math.max(
      ...[
        batterySync.lastUpdate,
        customerSync.lastUpdate,
        ticketSync.lastUpdate
      ].filter(Boolean).map(d => d!.getTime())
    )
  };
}

/**
 * Hook for manual data refresh with loading states
 */
export function useManualRefresh() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const refreshAll = async () => {
    const traceId = startPerformanceTrace('manual_refresh_all');
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        CacheManager.invalidateAll(),
        queryClient.refetchQueries({ type: 'active' })
      ]);
      
      endPerformanceTrace(traceId, 'success', {
        operation: 'manual_refresh_all'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const refreshDashboard = async () => {
    const traceId = startPerformanceTrace('manual_refresh_dashboard');
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        CacheManager.invalidateDashboard(),
        queryClient.refetchQueries({ queryKey: dashboardKeys.all, type: 'active' })
      ]);
      
      endPerformanceTrace(traceId, 'success', {
        operation: 'manual_refresh_dashboard'
      });
    } catch (error) {
      endPerformanceTrace(traceId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return {
    refreshAll,
    refreshDashboard,
    isRefreshing
  };
}
