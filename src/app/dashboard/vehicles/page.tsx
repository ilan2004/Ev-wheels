'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/page-container';
import { SectionHeader } from '@/components/layout/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { vehiclesApi, type VehicleCase } from '@/lib/api/vehicles';
import { VehicleDataTable } from '@/components/vehicles/vehicle-data-table';
import { VehicleMobileList } from '@/components/vehicles/vehicle-mobile-list';
import { VehicleGridView } from '@/components/vehicles/vehicle-grid-view';
import {
  ViewModeToggle,
  type ViewMode
} from '@/components/vehicles/view-mode-toggle';
import {
  VehicleFilters,
  type VehicleFilters as VehicleFiltersType
} from '@/components/vehicles/vehicle-filters';
import { QuickFilterChips } from '@/components/vehicles/quick-filter-chips';
import { Search, Plus, LayoutGrid } from 'lucide-react';
import { IconChartBar } from '@tabler/icons-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { useVehicleFilters } from '@/hooks/use-vehicle-filters';
import { useAuth } from '@/hooks/use-auth';

interface VehicleWithCustomer extends VehicleCase {
  customer?: {
    id: string;
    name: string;
    contact?: string;
    email?: string;
  };
  technician?: {
    id: string;
    name: string;
    email: string;
  };
  thumbnail_url?: string | null;
  last_activity_at?: string;
}

export default function VehiclesListPage() {
  const { user } = useAuth();
  const { filters, updateFilters, toApiParams } = useVehicleFilters();
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeQuickFilter, setActiveQuickFilter] = useState<
    string | undefined
  >();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vehicle-view-mode') as ViewMode) || 'table';
    }
    return 'table';
  });

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const offset = (currentPage - 1) * pageSize;
    const filterParams = toApiParams();

    const res = await vehiclesApi.listVehicles({
      search: debouncedSearch,
      limit: pageSize,
      offset,
      sortBy: sortColumn,
      sortDirection,
      ...filterParams
    });
    if (res.success && res.data) {
      setVehicles(res.data.vehicles);
      setTotalCount(res.data.totalCount);
    }
    setLoading(false);
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    sortColumn,
    sortDirection,
    toApiParams
  ]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('vehicle-view-mode', mode);
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleQuickFilterSelect = (
    quickFilters: Partial<VehicleFiltersType>
  ) => {
    updateFilters(quickFilters);
  };

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <SectionHeader
              title='Vehicle Cases'
              description='Manage vehicle service and repair cases'
            />
          </div>
          <div className='flex w-full flex-wrap gap-2 sm:w-auto'>
            <Button variant='outline' asChild>
              <Link href='/dashboard/vehicles/kanban'>
                <LayoutGrid className='mr-2 h-4 w-4' />
                Kanban View
              </Link>
            </Button>
            <Button variant='outline' asChild className='relative'>
              <Link href='/dashboard/vehicles/analytics'>
                <IconChartBar className='mr-2 h-4 w-4' />
                Analytics
                <span className='absolute -top-1 -right-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-medium text-white'>
                  NEW
                </span>
              </Link>
            </Button>
            <Button asChild>
              <Link href='/dashboard/job-cards/new'>
                <Plus className='mr-2 h-4 w-4' />
                New Job Card
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and View Controls */}
        <Card>
          <CardContent className='flex flex-col gap-4 pt-6'>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search by reg no, make, model, or customer...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9'
                />
              </div>
              <div className='flex flex-wrap justify-start gap-2'>
                <VehicleFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  loading={loading}
                />
                <ViewModeToggle
                  value={viewMode}
                  onValueChange={handleViewModeChange}
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className='-mx-4 overflow-x-auto px-4'>
              <QuickFilterChips
                onFilterSelect={handleQuickFilterSelect}
                activeFilterId={activeQuickFilter}
                userId={user?.id}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {viewMode === 'table' ? (
          <>
            {/* Mobile: card list */}
            <div className='md:hidden'>
              <VehicleMobileList vehicles={vehicles as any} loading={loading} />
            </div>
            {/* Desktop/Tablet: data table */}
            <div className='hidden md:block'>
              <VehicleDataTable
                vehicles={vehicles as any}
                loading={loading}
                totalCount={totalCount}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </div>
          </>
        ) : (
          <>
            <VehicleGridView vehicles={vehicles} loading={loading} />
            {!loading && totalCount > pageSize && (
              <div className='mt-6 flex justify-center'>
                <Button
                  variant='outline'
                  onClick={() => setPageSize(pageSize + 20)}
                  disabled={vehicles.length >= totalCount}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
