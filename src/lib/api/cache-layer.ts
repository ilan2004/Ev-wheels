// E-Wheels Performance Optimization: Intelligent Caching Layer
// Phase 3: Database Query Optimization with intelligent caching

import { unstable_cache as cache } from 'next/cache';
import { optimizedKpiService, type OptimizedKpis, type WeeklyDeliveryPoint, type BatterySummary, type CustomerSummary } from './optimized-kpis';
import { getActiveLocationId } from '@/lib/location/session';

/**
 * Cache configuration constants
 */
const CACHE_CONFIG = {
  // KPIs change frequently, cache for 5 minutes
  DASHBOARD_KPIS: {
    ttl: 5 * 60, // 5 minutes
    tags: ['kpis', 'dashboard']
  },
  
  // Weekly trends change less frequently, cache for 1 hour
  WEEKLY_TRENDS: {
    ttl: 60 * 60, // 1 hour
    tags: ['trends', 'charts']
  },
  
  // Battery summaries change often, cache for 2 minutes
  BATTERY_SUMMARIES: {
    ttl: 2 * 60, // 2 minutes
    tags: ['batteries', 'summaries']
  },
  
  // Customer summaries change less often, cache for 10 minutes
  CUSTOMER_SUMMARIES: {
    ttl: 10 * 60, // 10 minutes
    tags: ['customers', 'summaries']
  },
  
  // Dashboard bundle combines multiple data sources, cache for 3 minutes
  DASHBOARD_BUNDLE: {
    ttl: 3 * 60, // 3 minutes
    tags: ['dashboard', 'bundle', 'kpis']
  }
};

/**
 * Cache key generators that include location context
 */
const createCacheKey = (prefix: string, params?: Record<string, any>): string => {
  const locationId = getActiveLocationId() || 'default';
  const paramString = params ? JSON.stringify(params) : '';
  return `${prefix}:${locationId}:${paramString}`;
};

/**
 * Cached KPI service that wraps the optimized service with intelligent caching
 */
export class CachedKpiService {
  
  /**
   * Fetch cached dashboard KPIs
   */
  async fetchDashboardKpis() {
    const cacheKey = createCacheKey('dashboard-kpis');
    
    return cache(
      async () => {
        console.log('Cache miss: Fetching dashboard KPIs from database');
        return await optimizedKpiService.fetchDashboardKpis();
      },
      [cacheKey],
      {
        revalidate: CACHE_CONFIG.DASHBOARD_KPIS.ttl,
        tags: CACHE_CONFIG.DASHBOARD_KPIS.tags
      }
    )();
  }
  
  /**
   * Fetch cached weekly delivery trends
   */
  async fetchWeeklyDeliveryTrends(weeks: number = 8) {
    const cacheKey = createCacheKey('weekly-trends', { weeks });
    
    return cache(
      async () => {
        console.log('Cache miss: Fetching weekly trends from database');
        return await optimizedKpiService.fetchWeeklyDeliveryTrends(weeks);
      },
      [cacheKey],
      {
        revalidate: CACHE_CONFIG.WEEKLY_TRENDS.ttl,
        tags: CACHE_CONFIG.WEEKLY_TRENDS.tags
      }
    )();
  }
  
  /**
   * Fetch cached battery summaries with smart cache invalidation
   */
  async fetchBatterySummaries(params: {
    search?: string;
    status?: string;
    brand?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const cacheKey = createCacheKey('battery-summaries', params);
    
    // Shorter cache for paginated results
    const ttl = params.offset ? CACHE_CONFIG.BATTERY_SUMMARIES.ttl / 2 : CACHE_CONFIG.BATTERY_SUMMARIES.ttl;
    
    return cache(
      async () => {
        console.log('Cache miss: Fetching battery summaries from database');
        return await optimizedKpiService.fetchBatterySummaries(params);
      },
      [cacheKey],
      {
        revalidate: ttl,
        tags: [...CACHE_CONFIG.BATTERY_SUMMARIES.tags, ...(params.status ? [`status-${params.status}`] : [])]
      }
    )();
  }
  
  /**
   * Fetch cached customer summaries
   */
  async fetchCustomerSummaries(params: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const cacheKey = createCacheKey('customer-summaries', params);
    
    return cache(
      async () => {
        console.log('Cache miss: Fetching customer summaries from database');
        return await optimizedKpiService.fetchCustomerSummaries(params);
      },
      [cacheKey],
      {
        revalidate: CACHE_CONFIG.CUSTOMER_SUMMARIES.ttl,
        tags: CACHE_CONFIG.CUSTOMER_SUMMARIES.tags
      }
    )();
  }
  
  /**
   * Fetch cached dashboard bundle - combines multiple datasets efficiently
   */
  async fetchDashboardBundle() {
    const cacheKey = createCacheKey('dashboard-bundle');
    
    return cache(
      async () => {
        console.log('Cache miss: Fetching dashboard bundle from database');
        return await optimizedKpiService.fetchDashboardBundle();
      },
      [cacheKey],
      {
        revalidate: CACHE_CONFIG.DASHBOARD_BUNDLE.ttl,
        tags: CACHE_CONFIG.DASHBOARD_BUNDLE.tags
      }
    )();
  }
}

/**
 * Cache management utilities
 */
export class CacheManager {
  
  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(tags: string[]) {
    try {
      // Import revalidateTag dynamically to avoid server-only import issues
      const { revalidateTag } = await import('next/cache');
      
      for (const tag of tags) {
        console.log(`Invalidating cache tag: ${tag}`);
        revalidateTag(tag);
      }
    } catch (error) {
      console.error('Error invalidating cache tags:', error);
    }
  }
  
  /**
   * Invalidate dashboard-related caches
   */
  static async invalidateDashboard() {
    await this.invalidateByTags(['dashboard', 'kpis', 'bundle']);
  }
  
  /**
   * Invalidate battery-related caches
   */
  static async invalidateBatteries() {
    await this.invalidateByTags(['batteries', 'summaries', 'kpis', 'dashboard']);
  }
  
  /**
   * Invalidate customer-related caches
   */
  static async invalidateCustomers() {
    await this.invalidateByTags(['customers', 'summaries', 'kpis', 'dashboard']);
  }
  
  /**
   * Invalidate trend-related caches
   */
  static async invalidateTrends() {
    await this.invalidateByTags(['trends', 'charts']);
  }
  
  /**
   * Invalidate all caches (use sparingly)
   */
  static async invalidateAll() {
    await this.invalidateByTags(['dashboard', 'kpis', 'batteries', 'customers', 'trends', 'charts', 'summaries', 'bundle']);
  }
}

/**
 * Utility function to prefetch critical data
 */
export class CachePrefetcher {
  
  /**
   * Prefetch dashboard data during low-traffic periods
   */
  static async prefetchDashboardData() {
    try {
      console.log('Prefetching dashboard data...');
      const service = new CachedKpiService();
      
      // Prefetch in parallel
      await Promise.all([
        service.fetchDashboardKpis(),
        service.fetchWeeklyDeliveryTrends(8),
        service.fetchBatterySummaries({ limit: 10 }),
        service.fetchCustomerSummaries({ limit: 5 })
      ]);
      
      console.log('Dashboard data prefetch completed');
    } catch (error) {
      console.error('Error during dashboard data prefetch:', error);
    }
  }
  
  /**
   * Prefetch commonly accessed battery data
   */
  static async prefetchBatteryData() {
    try {
      console.log('Prefetching battery data...');
      const service = new CachedKpiService();
      
      // Prefetch common battery queries
      await Promise.all([
        service.fetchBatterySummaries({ limit: 20 }),
        service.fetchBatterySummaries({ status: 'pending', limit: 10 }),
        service.fetchBatterySummaries({ status: 'completed', limit: 10 })
      ]);
      
      console.log('Battery data prefetch completed');
    } catch (error) {
      console.error('Error during battery data prefetch:', error);
    }
  }
}

/**
 * Performance monitoring for cache effectiveness
 */
export class CachePerformanceMonitor {
  private static hits = 0;
  private static misses = 0;
  
  static recordHit() {
    this.hits++;
  }
  
  static recordMiss() {
    this.misses++;
  }
  
  static getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }
  
  static resetStats() {
    this.hits = 0;
    this.misses = 0;
  }
  
  static logStats() {
    const stats = this.getStats();
    console.log(`Cache Performance - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate}%`);
  }
}

// Export singleton instance
export const cachedKpiService = new CachedKpiService();

// Export types for compatibility
export type { OptimizedKpis, WeeklyDeliveryPoint, BatterySummary, CustomerSummary } from './optimized-kpis';
