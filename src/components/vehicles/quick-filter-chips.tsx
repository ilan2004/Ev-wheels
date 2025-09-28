'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  Package,
  AlertCircle,
  User,
  CheckCircle,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import type { VehicleFilters } from './vehicle-filters';
import type { VehicleStatus } from '@/lib/types/service-tickets';
import { subDays } from 'date-fns';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  getFilters: (userId?: string) => Partial<VehicleFilters>;
}

interface QuickFilterChipsProps {
  onFilterSelect: (filters: Partial<VehicleFilters>) => void;
  activeFilterId?: string;
  userId?: string;
}

const quickFilters: QuickFilter[] = [
  {
    id: 'my-vehicles',
    label: 'My Vehicles',
    icon: User,
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    getFilters: (userId) => ({
      technicianId: userId || null,
      status: ['received', 'diagnosed', 'in_progress'] as VehicleStatus[],
    }),
  },
  {
    id: 'urgent',
    label: 'Urgent',
    icon: AlertCircle,
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    getFilters: () => ({
      dateRange: {
        from: null,
        to: subDays(new Date(), 7),
      },
      status: ['received', 'diagnosed', 'in_progress', 'on_hold'] as VehicleStatus[],
    }),
  },
  {
    id: 'ready-for-delivery',
    label: 'Ready for Delivery',
    icon: Package,
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    getFilters: () => ({
      status: ['completed'] as VehicleStatus[],
    }),
  },
  {
    id: 'awaiting-parts',
    label: 'Awaiting Parts',
    icon: PauseCircle,
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    getFilters: () => ({
      status: ['on_hold'] as VehicleStatus[],
    }),
  },
  {
    id: 'new-arrivals',
    label: 'New Arrivals',
    icon: Clock,
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    getFilters: () => ({
      status: ['received'] as VehicleStatus[],
      dateRange: {
        from: subDays(new Date(), 7),
        to: new Date(),
      },
    }),
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    getFilters: () => ({
      status: ['completed', 'delivered'] as VehicleStatus[],
    }),
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    getFilters: () => ({
      status: ['cancelled'] as VehicleStatus[],
    }),
  },
];

export function QuickFilterChips({ 
  onFilterSelect, 
  activeFilterId,
  userId 
}: QuickFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilterId === filter.id;
        
        return (
          <Badge
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all duration-200 text-xs font-medium",
              isActive ? filter.color : `hover:${filter.color}`,
              "border-transparent"
            )}
            onClick={() => onFilterSelect(filter.getFilters(userId))}
          >
            <Icon className="mr-1 h-3 w-3" />
            {filter.label}
          </Badge>
        );
      })}
    </div>
  );
}
