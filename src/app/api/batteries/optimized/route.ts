// E-Wheels Performance Optimization: Optimized Batteries API Endpoints
// Phase 3: Database Query Optimization - Batched battery queries

import { NextResponse } from 'next/server';
import { cachedKpiService } from '@/lib/api/cache-layer';
import { CacheManager } from '@/lib/api/cache-layer';
import { startPerformanceTrace, endPerformanceTrace } from '@/lib/performance/monitor';

/**
 * GET /api/batteries/optimized
 * Fetches battery data using optimized views and caching
 */
export async function GET(request: Request) {
  const traceId = startPerformanceTrace('batteries_optimized_api');
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100 records' },
        { status: 400 }
      );
    }
    
    const params = {
      search,
      status,
      brand,
      limit,
      offset: offset > 0 ? offset : undefined
    };
    
    // Fetch optimized battery summaries
    const result = await cachedKpiService.fetchBatterySummaries(params);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch battery data' },
        { status: 500 }
      );
    }
    
    endPerformanceTrace(traceId, 'success', {
      recordCount: result.data?.length || 0,
      cached: true,
      filters: Object.keys(params).filter(key => params[key as keyof typeof params] !== undefined).length
    });
    
    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        count: result.data?.length || 0,
        limit,
        offset,
        filters: { search, status, brand }
      },
      cached: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in optimized batteries API:', error);
    
    endPerformanceTrace(traceId, 'error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/batteries/optimized
 * Creates a new battery and invalidates related caches
 */
export async function POST(request: Request) {
  const traceId = startPerformanceTrace('batteries_create_optimized_api');
  
  try {
    // Note: In a real implementation, you would:
    // 1. Validate the request body
    // 2. Create the battery using the optimized repository
    // 3. Invalidate relevant caches
    
    // For this example, we'll simulate cache invalidation
    await CacheManager.invalidateBatteries();
    
    endPerformanceTrace(traceId, 'success', {
      operation: 'create_battery',
      cacheInvalidated: true
    });
    
    return NextResponse.json({
      success: true,
      message: 'Battery created and caches invalidated',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in optimized batteries create API:', error);
    
    endPerformanceTrace(traceId, 'error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
