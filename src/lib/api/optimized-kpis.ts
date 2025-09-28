// E-Wheels Performance Optimization: Optimized KPI Service
// Phase 3: Database Query Optimization with batching and views

import { supabase } from '@/lib/supabase/client';
import { getActiveLocationId } from '@/lib/location/session';

export interface OptimizedKpis {
  totalBatteries: number;
  pendingRepairs: number;
  completedThisMonth: number;
  activeCustomers: number;
  ticketStatus: Record<string, number>;
}

export interface WeeklyDeliveryPoint {
  weekStart: string; // ISO date (monday)
  count: number;
}

export interface BatterySummary {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  customer_name: string;
  customer_contact: string;
  status: string;
  status_category: 'pending' | 'completed' | 'other';
  days_since_received: number | null;
  delivery_status: 'delivered' | 'ready' | 'in_progress';
  estimated_cost: number | null;
  final_cost: number | null;
  received_date: string | null;
  delivered_date: string | null;
  location_id: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  total_batteries: number;
  pending_batteries: number;
  completed_batteries: number;
  total_revenue: number;
  avg_battery_cost: number;
  last_battery_received: string | null;
  last_delivery: string | null;
  location_id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Optimized KPI service that uses database views for better performance
 * Replaces individual queries with single view-based queries
 */
export class OptimizedKpiService {
  
  /**
   * Fetch all dashboard KPIs in a single optimized query
   * Uses the dashboard_kpis view which combines all calculations
   */
  async fetchDashboardKpis(): Promise<ApiResponse<OptimizedKpis>> {
    try {
      const locationId = getActiveLocationId();
      
      let query = supabase
        .from('dashboard_kpis')
        .select('*');
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        // Fallback to original method if view doesn't exist
        console.warn('Dashboard KPIs view not available, falling back to individual queries:', error.message);
        return this.fetchKpisLegacy();
      }
      
      const kpis: OptimizedKpis = {
        totalBatteries: data.total_batteries || 0,
        pendingRepairs: data.pending_repairs || 0,
        completedThisMonth: data.completed_this_month || 0,
        activeCustomers: data.active_customers || 0,
        ticketStatus: data.ticket_status || {}
      };
      
      return { success: true, data: kpis };
      
    } catch (error) {
      console.error('Error fetching optimized KPIs:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch KPIs' };
    }
  }
  
  /**
   * Fetch weekly delivery trends using optimized view
   * Pre-calculated and includes gap filling for consistent chart data
   */
  async fetchWeeklyDeliveryTrends(weeks: number = 8): Promise<ApiResponse<WeeklyDeliveryPoint[]>> {
    try {
      const locationId = getActiveLocationId();
      
      let query = supabase
        .from('weekly_delivery_trends')
        .select('*')
        .order('week_start', { ascending: true })
        .limit(weeks);
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.warn('Weekly delivery trends view not available, falling back to calculation:', error.message);
        return this.fetchWeeklyDeliveryTrendsLegacy(weeks);
      }
      
      const trends: WeeklyDeliveryPoint[] = (data || []).map(row => ({
        weekStart: row.week_start,
        count: row.deliveries
      }));
      
      return { success: true, data: trends };
      
    } catch (error) {
      console.error('Error fetching weekly delivery trends:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch weekly trends' };
    }
  }
  
  /**
   * Fetch battery summaries with pre-joined customer data and calculated metrics
   * Uses optimized view instead of manual joins
   */
  async fetchBatterySummaries(params: {
    search?: string;
    status?: string;
    brand?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<BatterySummary[]>> {
    try {
      const locationId = getActiveLocationId();
      
      let query = supabase
        .from('battery_summary_stats')
        .select('*')
        .order('received_date', { ascending: false });
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      // Apply filters
      if (params.status) {
        if (params.status === 'pending') {
          query = query.eq('status_category', 'pending');
        } else if (params.status === 'completed') {
          query = query.eq('status_category', 'completed');
        } else {
          query = query.eq('status', params.status);
        }
      }
      
      if (params.brand) {
        query = query.eq('brand', params.brand);
      }
      
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        query = query.or(`serial_number.ilike.${term},brand.ilike.${term},customer_name.ilike.${term}`);
      }
      
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const summaries: BatterySummary[] = (data || []).map(row => ({
        id: row.id,
        serial_number: row.serial_number,
        brand: row.brand,
        model: row.model,
        customer_name: row.customer_name,
        customer_contact: row.customer_contact,
        status: row.status,
        status_category: row.status_category,
        days_since_received: row.days_since_received,
        delivery_status: row.delivery_status,
        estimated_cost: row.estimated_cost,
        final_cost: row.final_cost,
        received_date: row.received_date,
        delivered_date: row.delivered_date,
        location_id: row.location_id
      }));
      
      return { success: true, data: summaries };
      
    } catch (error) {
      console.error('Error fetching battery summaries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch battery summaries' };
    }
  }
  
  /**
   * Fetch customer summaries with aggregated battery statistics
   * Uses pre-calculated metrics from the view
   */
  async fetchCustomerSummaries(params: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<CustomerSummary[]>> {
    try {
      const locationId = getActiveLocationId();
      
      let query = supabase
        .from('customer_activity_summary')
        .select('*')
        .order('last_battery_received', { ascending: false, nullsFirst: false });
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        query = query.or(`name.ilike.${term},contact.ilike.${term},email.ilike.${term}`);
      }
      
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { success: true, data: data || [] };
      
    } catch (error) {
      console.error('Error fetching customer summaries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch customer summaries' };
    }
  }
  
  /**
   * Batch fetch multiple dashboard data sets in parallel
   * Combines KPIs, trends, and recent summaries efficiently
   */
  async fetchDashboardBundle(): Promise<ApiResponse<{
    kpis: OptimizedKpis;
    weeklyTrends: WeeklyDeliveryPoint[];
    recentBatteries: BatterySummary[];
    topCustomers: CustomerSummary[];
  }>> {
    try {
      // Execute all queries in parallel for better performance
      const [kpisResult, trendsResult, batteriesResult, customersResult] = await Promise.all([
        this.fetchDashboardKpis(),
        this.fetchWeeklyDeliveryTrends(8),
        this.fetchBatterySummaries({ limit: 10 }),
        this.fetchCustomerSummaries({ limit: 5 })
      ]);
      
      // Check if any critical query failed
      if (!kpisResult.success) {
        return { success: false, error: kpisResult.error };
      }
      
      const bundle = {
        kpis: kpisResult.data!,
        weeklyTrends: trendsResult.success ? trendsResult.data! : [],
        recentBatteries: batteriesResult.success ? batteriesResult.data! : [],
        topCustomers: customersResult.success ? customersResult.data! : []
      };
      
      return { success: true, data: bundle };
      
    } catch (error) {
      console.error('Error fetching dashboard bundle:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' };
    }
  }
  
  /**
   * Legacy KPI fetching method - fallback when views are not available
   */
  private async fetchKpisLegacy(): Promise<ApiResponse<OptimizedKpis>> {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const locationId = getActiveLocationId();
      const scopeQuery = (q: any) => locationId ? q.eq('location_id', locationId) : q;
      
      const [bCount, pending, completedMonth, customers, tickets] = await Promise.all([
        scopeQuery(supabase.from('battery_records').select('id', { count: 'exact', head: true })),
        scopeQuery(supabase.from('battery_records').select('id', { count: 'exact', head: true }).in('status', ['received', 'diagnosed', 'in_progress'])),
        scopeQuery(supabase.from('battery_records').select('id', { count: 'exact', head: true }).gte('delivered_date', monthStart.toISOString()).in('status', ['completed', 'delivered'])),
        scopeQuery(supabase.from('customers').select('id', { count: 'exact', head: true })),
        scopeQuery(supabase.from('service_tickets').select('status'))
      ]);
      
      if (bCount.error) throw bCount.error;
      if (pending.error) throw pending.error;
      if (completedMonth.error) throw completedMonth.error;
      if (customers.error) throw customers.error;
      if (tickets.error) throw tickets.error;
      
      const statusCounts: Record<string, number> = {};
      (tickets.data || []).forEach((t: any) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });
      
      return {
        success: true,
        data: {
          totalBatteries: bCount.count || 0,
          pendingRepairs: pending.count || 0,
          completedThisMonth: completedMonth.count || 0,
          activeCustomers: customers.count || 0,
          ticketStatus: statusCounts
        }
      };
    } catch (error) {
      console.error('Error in legacy KPI fetch:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch KPIs' };
    }
  }
  
  /**
   * Legacy weekly trends calculation - fallback when view is not available
   */
  private async fetchWeeklyDeliveryTrendsLegacy(weeks: number): Promise<ApiResponse<WeeklyDeliveryPoint[]>> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - weeks * 7);
      
      const locationId = getActiveLocationId();
      let query = supabase
        .from('battery_records')
        .select('delivered_date')
        .gte('delivered_date', start.toISOString());
        
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Manual calculation logic here (same as original)
      const buckets: Record<string, number> = {};
      for (let i = 0; i < weeks; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i * 7);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      
      (data || []).forEach((row: any) => {
        if (!row.delivered_date) return;
        const d = new Date(row.delivered_date);
        const key = d.toISOString().slice(0, 10);
        if (buckets[key] !== undefined) buckets[key]++;
      });
      
      const points = Object.keys(buckets)
        .sort()
        .map((k) => ({ weekStart: k, count: buckets[k] }));
      
      return { success: true, data: points };
    } catch (error) {
      console.error('Error in legacy weekly trends fetch:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch weekly trends' };
    }
  }
}

// Export singleton instance
export const optimizedKpiService = new OptimizedKpiService();

// Export legacy types for compatibility
export type { OptimizedKpis as Kpis, WeeklyDeliveryPoint as WeeklyPoint, ApiResponse as KpiResponse };
