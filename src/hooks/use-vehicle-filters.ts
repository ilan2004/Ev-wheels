import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { VehicleFilters } from '@/components/vehicles/vehicle-filters';
import type { VehicleStatus } from '@/lib/types/service-tickets';

export function useVehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const filters = useMemo<VehicleFilters>(() => {
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const technicianId = searchParams.get('technicianId');
    const customerId = searchParams.get('customerId');

    return {
      status: status ? status.split(',') as VehicleStatus[] : [],
      dateRange: {
        from: dateFrom ? new Date(dateFrom) : null,
        to: dateTo ? new Date(dateTo) : null,
      },
      technicianId: technicianId || null,
      customerId: customerId || null,
    };
  }, [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback((newFilters: Partial<VehicleFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    // Merge with existing filters
    const mergedFilters = { ...filters, ...newFilters };

    // Update status
    if ('status' in newFilters) {
      if (mergedFilters.status.length > 0) {
        params.set('status', mergedFilters.status.join(','));
      } else {
        params.delete('status');
      }
    }

    // Update date range
    if ('dateRange' in newFilters) {
      if (mergedFilters.dateRange.from) {
        params.set('dateFrom', mergedFilters.dateRange.from.toISOString());
      } else {
        params.delete('dateFrom');
      }
      
      if (mergedFilters.dateRange.to) {
        params.set('dateTo', mergedFilters.dateRange.to.toISOString());
      } else {
        params.delete('dateTo');
      }
    }

    // Update technician
    if ('technicianId' in newFilters) {
      if (mergedFilters.technicianId) {
        params.set('technicianId', mergedFilters.technicianId);
      } else {
        params.delete('technicianId');
      }
    }

    // Update customer
    if ('customerId' in newFilters) {
      if (mergedFilters.customerId) {
        params.set('customerId', mergedFilters.customerId);
      } else {
        params.delete('customerId');
      }
    }

    // Always reset to page 1 when filters change
    params.delete('page');

    // Update URL
    router.push(`?${params.toString()}`);
  }, [filters, searchParams, router]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('status');
    params.delete('dateFrom');
    params.delete('dateTo');
    params.delete('technicianId');
    params.delete('customerId');
    params.delete('page');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  // Convert filters to API params
  const toApiParams = useCallback(() => {
    return {
      status: filters.status.length > 0 ? filters.status : undefined,
      dateFrom: filters.dateRange.from?.toISOString(),
      dateTo: filters.dateRange.to?.toISOString(),
      technicianId: filters.technicianId || undefined,
      customerId: filters.customerId || undefined,
    };
  }, [filters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    toApiParams,
  };
}
