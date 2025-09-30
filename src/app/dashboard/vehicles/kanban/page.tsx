'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/page-container';
import { SectionHeader } from '@/components/layout/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { vehiclesApi, type VehicleCase } from '@/lib/api/vehicles';
import { VehicleKanbanBoard } from '@/components/vehicles/vehicle-kanban-board';
import {
  VehicleFilters,
  type VehicleFilters as VehicleFiltersType
} from '@/components/vehicles/vehicle-filters';
import { QuickFilterChips } from '@/components/vehicles/quick-filter-chips';
import { Search, Plus, LayoutGrid, Table } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useVehicleFilters } from '@/hooks/use-vehicle-filters';
import { useAuth } from '@/hooks/use-auth';
import type { VehicleStatus } from '@/lib/types/service-tickets';

interface VehicleWithCustomer extends VehicleCase {
  customer?: {
    id: string;
    name: string;
    contact?: string;
  };
  technician?: {
    id: string;
    name: string;
    email: string;
  };
  thumbnail_url?: string | null;
  last_activity_at?: string;
}

export default function VehiclesKanbanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { filters, updateFilters, toApiParams } = useVehicleFilters();
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<
    string | undefined
  >();

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const filterParams = toApiParams();

    const res = await vehiclesApi.listVehicles({
      search: debouncedSearch,
      limit: 200, // Load more for kanban view
      offset: 0,
      ...filterParams
    });
    if (res.success && res.data) {
      setVehicles(res.data.vehicles);
    }
    setLoading(false);
  }, [debouncedSearch, toApiParams]);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuickFilterSelect = (
    quickFilters: Partial<VehicleFiltersType>
  ) => {
    updateFilters(quickFilters);
  };

  const handleStatusChange = (vehicleId: string, newStatus: VehicleStatus) => {
    // Optimistic update for kanban
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v))
    );
  };

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <SectionHeader
            title='Vehicle Workflow'
            description='Drag and drop to update vehicle status'
          />
          <Button asChild>
            <Link href='/dashboard/job-cards/new'>
              <Plus className='mr-2 h-4 w-4' />
              New Job Card
            </Link>
          </Button>
        </div>

        {/* Search and Controls */}
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
              <div className='flex gap-2'>
                <VehicleFilters
                  filters={filters}
                  onFiltersChange={updateFilters}
                  loading={loading}
                />

                {/* View Switcher */}
                <ToggleGroup
                  type='single'
                  value='kanban'
                  onValueChange={(value) => {
                    if (value === 'list') {
                      router.push('/dashboard/vehicles');
                    }
                  }}
                >
                  <ToggleGroupItem value='list' aria-label='List view'>
                    <Table className='h-4 w-4' />
                  </ToggleGroupItem>
                  <ToggleGroupItem value='kanban' aria-label='Kanban view'>
                    <LayoutGrid className='h-4 w-4' />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Quick Filters */}
            <QuickFilterChips
              onFilterSelect={handleQuickFilterSelect}
              activeFilterId={activeQuickFilter}
              userId={user?.id}
            />
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <VehicleKanbanBoard
          vehicles={vehicles}
          loading={loading}
          onStatusChange={handleStatusChange}
        />
      </div>
    </PageContainer>
  );
}
