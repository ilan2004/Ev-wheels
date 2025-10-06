// E-Wheels Sidebar Live Data Hook
// Provides real-time data for sidebar navigation badges and stats

import { useQuery } from '@tanstack/react-query';
import { useDashboardKpis } from './use-dashboard-data';
import { useBatteries } from './use-batteries';
import { supabase } from '@/lib/supabase/client';
import { getActiveLocationId } from '@/lib/location/session';
import React from 'react';

/**
 * Interface for sidebar live data
 */
export interface SidebarLiveData {
  // Main KPIs for header stats
  totalTasks: number;
  completedTasks: number;
  urgentTasks: number;
  
  // Navigation item counts
  jobCards: {
    total: number;
    urgent: number;
    newToday: number;
  };
  batteries: {
    total: number;
    urgent: number;
    pending: number;
  };
  inventory: {
    total: number;
    lowStock: number;
    alerts: number;
  };
  quotes: {
    total: number;
    pending: number;
    expiringSoon: number;
  };
  vehicles: {
    total: number;
    overdue: number;
    readyForPickup: number;
  };
  customers: {
    total: number;
    activeThisMonth: number;
  };
}

/**
 * Query keys for sidebar data caching
 */
export const sidebarKeys = {
  all: ['sidebar'] as const,
  data: () => [...sidebarKeys.all, 'data'] as const,
  counts: (type: string) => [...sidebarKeys.all, 'counts', type] as const,
} as const;

/**
 * Helper function to fetch job card counts (service tickets)
 */
async function fetchJobCardCounts() {
  try {
    let baseQuery = supabase
      .from('service_tickets')
      .select('status, created_at, priority, updated_at');
    
    // Skip location filtering for now to simplify debugging
  
    const { data, error } = await baseQuery;
    
    if (error) {
      console.warn('Service tickets table error:', error.message);
      return {
        total: 0,
        urgent: 0,
        newToday: 0
      };
    }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const counts = {
    total: data?.length || 0,
    urgent: 0,
    newToday: 0
  };
  
    data?.forEach(ticket => {
      // Count high priority tickets (priority 1 = high)
      if (ticket.priority === 1) {
        counts.urgent++;
      }
      
      // Count tickets created today
      const createdAt = new Date(ticket.created_at);
      if (createdAt >= today) {
        counts.newToday++;
      }
    });
    
    return counts;
  } catch (err) {
    console.warn('Error in fetchJobCardCounts:', err);
    return {
      total: 0,
      urgent: 0,
      newToday: 0
    };
  }
}

/**
 * Helper function to fetch vehicle counts
 */
async function fetchVehicleCounts() {
  try {
    let baseQuery = supabase
      .from('vehicle_cases')
      .select('status, received_date, updated_at');
    
    // Skip location filtering for now
    
    const { data, error } = await baseQuery;
    
    if (error) {
      console.warn('Vehicle cases table not found, using default values:', error.message);
      return {
        total: 0,
        overdue: 0,
        readyForPickup: 0
      };
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const counts = {
      total: data?.length || 0,
      overdue: 0,
      readyForPickup: 0
    };
    
    data?.forEach(vehicle => {
      // Count overdue vehicles (older than 7 days and not completed)
      const receivedAt = new Date(vehicle.received_date);
      if (
        receivedAt < sevenDaysAgo && 
        !['delivered', 'cancelled', 'completed'].includes(vehicle.status)
      ) {
        counts.overdue++;
      }
      
      // Count vehicles ready for pickup
      if (['completed', 'ready_for_pickup'].includes(vehicle.status)) {
        counts.readyForPickup++;
      }
    });
    
    return counts;
  } catch (err) {
    console.warn('Error fetching vehicle counts:', err);
    return {
      total: 0,
      overdue: 0,
      readyForPickup: 0
    };
  }
}

/**
 * Helper function to fetch inventory counts
 */
async function fetchInventoryCounts() {
  try {
    // Try inventory table first, then fallback to inventory_items  
    let baseQuery = supabase
      .from('inventory')
      .select('quantity, min_stock_level, status');
    
    // Skip location filtering for now
    
    let { data, error } = await baseQuery;
    
    // If 'inventory' doesn't exist, try 'inventory_items'
    if (error && error.message.includes('does not exist')) {
      let fallbackQuery = supabase
        .from('inventory_items')
        .select('quantity, min_stock_level, status');
      
      // Skip location filtering for fallback too
      
      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }
    
    if (error) {
      console.warn('Inventory table not found, using default values:', error.message);
      return {
        total: 0,
        lowStock: 0,
        alerts: 0
      };
    }
    
    const counts = {
      total: data?.length || 0,
      lowStock: 0,
      alerts: 0
    };
    
    data?.forEach(item => {
      // Count low stock items
      if (item.quantity <= (item.min_stock_level || 0)) {
        counts.lowStock++;
        counts.alerts++; // Low stock is also an alert
      }
    });
    
    return counts;
  } catch (err) {
    console.warn('Error fetching inventory counts:', err);
    return {
      total: 0,
      lowStock: 0,
      alerts: 0
    };
  }
}

/**
 * Helper function to fetch quote counts
 */
async function fetchQuoteCounts() {
  try {
    let baseQuery = supabase
      .from('quotes')
      .select('status, valid_until, created_at');
    
    // Skip location filtering for now
    
    const { data, error } = await baseQuery;
    
    if (error) {
      console.warn('Quotes table not found, using default values:', error.message);
      return {
        total: 0,
        pending: 0,
        expiringSoon: 0
      };
    }
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const counts = {
      total: data?.length || 0,
      pending: 0,
      expiringSoon: 0
    };
    
    data?.forEach(quote => {
      // Count pending quotes
      if (quote.status === 'draft' || quote.status === 'sent' || quote.status === 'pending') {
        counts.pending++;
      }
      
      // Count quotes expiring soon
      if (quote.valid_until) {
        const validUntil = new Date(quote.valid_until);
        if (validUntil <= thirtyDaysFromNow && validUntil > new Date()) {
          counts.expiringSoon++;
        }
      }
    });
    
    return counts;
  } catch (err) {
    console.warn('Error fetching quote counts:', err);
    return {
      total: 0,
      pending: 0,
      expiringSoon: 0
    };
  }
}

/**
 * Helper function to fetch customer counts
 */
async function fetchCustomerCounts() {
  try {
    let baseQuery = supabase
      .from('customers')
      .select('id, created_at');
    
    // Skip location filtering for now
    
    const { data, error } = await baseQuery;
    
    if (error) {
      console.warn('Error fetching customers:', error.message);
      return {
        total: 0,
        activeThisMonth: 0
      };
    }
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const counts = {
      total: data?.length || 0,
      activeThisMonth: 0
    };
    
    // Count customers created this month
    data?.forEach(customer => {
      const createdAt = new Date(customer.created_at);
      if (createdAt >= monthStart) {
        counts.activeThisMonth++;
      }
    });
    
    return counts;
  } catch (err) {
    console.warn('Error fetching customer counts:', err);
    return {
      total: 0,
      activeThisMonth: 0
    };
  }
}

/**
 * Custom hook for fetching sidebar live data
 */
export function useSidebarData() {
  const dashboardKpis = useDashboardKpis();
  const batteryData = useBatteries({ limit: 1000 }); // Get all batteries for accurate counts
  
  const sidebarQuery = useQuery({
    queryKey: sidebarKeys.data(),
    queryFn: async (): Promise<SidebarLiveData> => {
      try {
        // Fetch all counts in parallel for better performance
        const [
          jobCardCounts,
          vehicleCounts, 
          inventoryCounts,
          quoteCounts,
          customerCounts
        ] = await Promise.all([
          fetchJobCardCounts(),
          fetchVehicleCounts(),
          fetchInventoryCounts(),
          fetchQuoteCounts(),
          fetchCustomerCounts()
        ]);
        
        // Process battery data
        const batteries = batteryData.data || [];
        
        const batteryCounts = {
          total: batteries.length,
          urgent: batteries.filter(b => 
            ['received', 'diagnosed'].includes(b.status) && 
            b.days_since_received !== null && 
            b.days_since_received > 7
          ).length,
          pending: batteries.filter(b => b.status_category === 'pending').length
        };
        
        // Calculate task statistics from KPIs
        const kpis = dashboardKpis.data;
        const totalTasks = (kpis?.pendingRepairs || 0) + jobCardCounts.total;
        const completedTasks = kpis?.completedThisMonth || 0;
        const urgentTasks = jobCardCounts.urgent + batteryCounts.urgent + vehicleCounts.overdue;
        
        return {
          totalTasks,
          completedTasks,
          urgentTasks,
          jobCards: jobCardCounts,
          batteries: batteryCounts,
          inventory: inventoryCounts,
          quotes: quoteCounts,
          vehicles: vehicleCounts,
          customers: customerCounts
        };
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - fresh data for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnWindowFocus: true,
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes
    enabled: true, // Allow it to run regardless of dependencies for debugging
    retry: 2,
    retryDelay: 1000
  });
  
  return {
    data: sidebarQuery.data,
    isLoading: sidebarQuery.isLoading || dashboardKpis.isLoading || batteryData.isLoading,
    isError: sidebarQuery.isError || dashboardKpis.isError || batteryData.isError,
    error: sidebarQuery.error || dashboardKpis.error || batteryData.error,
    isSuccess: sidebarQuery.isSuccess && dashboardKpis.isSuccess && batteryData.isSuccess,
    isFetching: sidebarQuery.isFetching,
    refetch: sidebarQuery.refetch,
    dataUpdatedAt: sidebarQuery.dataUpdatedAt
  };
}

/**
 * Hook for getting specific navigation item counts
 */
export function useSidebarItemCounts(itemType: keyof Omit<SidebarLiveData, 'totalTasks' | 'completedTasks' | 'urgentTasks'>) {
  const { data, isLoading, isError } = useSidebarData();
  
  return React.useMemo(() => ({
    counts: data?.[itemType],
    isLoading,
    isError
  }), [data, itemType, isLoading, isError]);
}

/**
 * Hook for getting sidebar header stats
 */
export function useSidebarStats() {
  const { data, isLoading, isError } = useSidebarData();
  
  return React.useMemo(() => ({
    totalTasks: data?.totalTasks || 0,
    completedTasks: data?.completedTasks || 0,
    urgentTasks: data?.urgentTasks || 0,
    isLoading,
    isError
  }), [data?.totalTasks, data?.completedTasks, data?.urgentTasks, isLoading, isError]);
}
