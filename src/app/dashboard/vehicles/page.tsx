"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageContainer from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { vehiclesApi, type VehicleCase } from "@/lib/api/vehicles";
import { VehicleDataTable } from "@/components/vehicles/vehicle-data-table";
import { VehicleGridView } from "@/components/vehicles/vehicle-grid-view";
import { ViewModeToggle, type ViewMode } from "@/components/vehicles/view-mode-toggle";
import { VehicleFilters, type VehicleFilters as VehicleFiltersType } from "@/components/vehicles/vehicle-filters";
import { QuickFilterChips } from "@/components/vehicles/quick-filter-chips";
import { Search, Plus, LayoutGrid } from "lucide-react";
import { IconChartBar } from '@tabler/icons-react';
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { useVehicleFilters } from "@/hooks/use-vehicle-filters";
import { useAuth } from "@/hooks/use-auth";

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
  const [search, setSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | undefined>();
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
  }, [currentPage, pageSize, debouncedSearch, sortColumn, sortDirection, toApiParams]);

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

  const handleQuickFilterSelect = (quickFilters: Partial<VehicleFiltersType>) => {
    updateFilters(quickFilters);
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <SectionHeader 
            title="Vehicle Cases" 
            description="Manage vehicle service and repair cases" 
          />
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/vehicles/kanban">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban View
              </Link>
            </Button>
            <Button variant="outline" asChild className="relative">
              <Link href="/dashboard/vehicles/analytics">
                <IconChartBar className="mr-2 h-4 w-4" />
                Analytics
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                  NEW
                </span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Service Ticket
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and View Controls */}
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reg no, make, model, or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
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
            <QuickFilterChips
              onFilterSelect={handleQuickFilterSelect}
              activeFilterId={activeQuickFilter}
              userId={user?.id}
            />
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {viewMode === 'table' ? (
          <VehicleDataTable
            vehicles={vehicles}
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
        ) : (
          <>
            <VehicleGridView 
              vehicles={vehicles} 
              loading={loading} 
            />
            {!loading && totalCount > pageSize && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
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

