'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  CalendarIcon, 
  Filter, 
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import type { VehicleStatus } from '@/lib/types/service-tickets';
import { supabase } from '@/lib/supabase/client';

export interface VehicleFilters {
  status: VehicleStatus[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  technicianId: string | null;
  customerId: string | null;
}

interface VehicleFiltersProps {
  filters: VehicleFilters;
  onFiltersChange: (filters: VehicleFilters) => void;
  loading?: boolean;
}

interface Technician {
  id: string;
  email: string;
  full_name: string;
}

interface Customer {
  id: string;
  name: string;
  contact?: string;
}

const statusOptions: { value: VehicleStatus; label: string; color: string }[] = [
  { value: 'received', label: 'Received', color: 'bg-blue-100 text-blue-800' },
  { value: 'diagnosed', label: 'Diagnosed', color: 'bg-purple-100 text-purple-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-gray-100 text-gray-800' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
];

const datePresets = [
  { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This month', getValue: () => {
    const now = new Date();
    return { 
      from: new Date(now.getFullYear(), now.getMonth(), 1), 
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0) 
    };
  }},
];

export function VehicleFilters({ filters, onFiltersChange, loading }: VehicleFiltersProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [open, setOpen] = useState(false);

  // Load technicians and recent customers
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load technicians (users with technician role)
        const { data: techData } = await supabase
          .from('user_profiles')
          .select('user_id, role')
          .eq('role', 'technician');

        if (techData) {
          const userIds = techData.map(t => t.user_id);
          const { data: userData } = await supabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data')
            .in('id', userIds);

          if (userData) {
            setTechnicians(userData.map(u => ({
              id: u.id,
              email: u.email || '',
              full_name: `${u.raw_user_meta_data?.firstName || ''} ${u.raw_user_meta_data?.lastName || ''}`.trim() || u.email || ''
            })));
          }
        }

        // Load recent customers (from vehicle cases)
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, name, contact')
          .order('created_at', { ascending: false })
          .limit(50);

        if (customerData) {
          setCustomers(customerData);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleStatusToggle = (status: VehicleStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
    onFiltersChange({ ...filters, dateRange: range });
  };

  const handleTechnicianChange = (technicianId: string) => {
    onFiltersChange({ 
      ...filters, 
      technicianId: technicianId === 'all' ? null : technicianId 
    });
  };

  const handleCustomerChange = (customerId: string) => {
    onFiltersChange({ 
      ...filters, 
      customerId: customerId === 'all' ? null : customerId 
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      dateRange: { from: null, to: null },
      technicianId: null,
      customerId: null,
    });
  };

  const activeFiltersCount = 
    filters.status.length +
    (filters.dateRange.from ? 1 : 0) +
    (filters.technicianId ? 1 : 0) +
    (filters.customerId ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Vehicles</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your vehicle search
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(({ value, label, color }) => (
                <Badge
                  key={value}
                  variant={filters.status.includes(value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    filters.status.includes(value) ? color : "hover:bg-muted"
                  )}
                  onClick={() => handleStatusToggle(value)}
                >
                  {filters.status.includes(value) && (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="space-y-2">
              {/* Date Presets */}
              <div className="flex flex-wrap gap-2">
                {datePresets.map(({ label, getValue }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangeChange(getValue())}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              
              {/* Custom Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange.from || undefined}
                    selected={{
                      from: filters.dateRange.from || undefined,
                      to: filters.dateRange.to || undefined,
                    }}
                    onSelect={(range) => {
                      handleDateRangeChange({
                        from: range?.from || null,
                        to: range?.to || null,
                      });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Technician Filter */}
          <div className="space-y-3">
            <Label>Technician</Label>
            <Select
              value={filters.technicianId || 'all'}
              onValueChange={handleTechnicianChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder="All technicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All technicians</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Customer Filter */}
          <div className="space-y-3">
            <Label>Customer</Label>
            <Select
              value={filters.customerId || 'all'}
              onValueChange={handleCustomerChange}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.contact && (
                      <span className="text-muted-foreground ml-2">
                        ({customer.contact})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
