// E-Wheels Performance Optimization: Optimized Dashboard API Endpoints
// Phase 3: Database Query Optimization - Batched API endpoints

import { NextResponse } from 'next/server';
import { cachedKpiService } from '@/lib/api/cache-layer';
import { CachePerformanceMonitor } from '@/lib/api/cache-layer';
import { startPerformanceTrace, endPerformanceTrace } from '@/lib/performance/monitor';

/**
 * GET /api/dashboard/optimized
 * Fetches all dashboard data in a single optimized request
 * Uses cached, batched queries and database views
 */
export async function GET(request: Request) {
  const traceId = startPerformanceTrace('dashboard_optimized_api');
  
  try {
    const { searchParams } = new URL(request.url);
    const includeBundle = searchParams.get('bundle') !== 'false';
    
    if (includeBundle) {
      // Fetch complete dashboard bundle in a single cached query
      const result = await cachedKpiService.fetchDashboardBundle();
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch dashboard data' },
          { status: 500 }
        );
      }
      
      endPerformanceTrace(traceId, 'success', {
        dataPoints: Object.keys(result.data!).length,
        cached: true
      });
      
      return NextResponse.json({
        success: true,
        data: result.data,
        cached: true,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fetch individual components (for specific use cases)
      const kpisResult = await cachedKpiService.fetchDashboardKpis();
      
      if (!kpisResult.success) {
        return NextResponse.json(
          { error: kpisResult.error || 'Failed to fetch KPIs' },
          { status: 500 }
        );
      }
      
      endPerformanceTrace(traceId, 'success', {
        dataPoints: 1,
        cached: true
      });
      
      return NextResponse.json({
        success: true,
        data: kpisResult.data,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in optimized dashboard API:', error);
    
    endPerformanceTrace(traceId, 'error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
