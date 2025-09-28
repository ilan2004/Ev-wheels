'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Car, Clock, User, Wrench } from 'lucide-react';
import type { VehicleCase } from '@/lib/types/service-tickets';

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

interface VehicleGridViewProps {
  vehicles: VehicleWithCustomer[];
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800 border-blue-200',
  diagnosed: 'bg-purple-100 text-purple-800 border-purple-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-gray-100 text-gray-800 border-gray-200',
  on_hold: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabels: Record<string, string> = {
  received: 'Received',
  diagnosed: 'Diagnosed',
  in_progress: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

function getDaysInService(receivedDate: string): number {
  return Math.floor((Date.now() - new Date(receivedDate).getTime()) / (1000 * 60 * 60 * 24));
}

function GridSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function VehicleGridView({ vehicles, loading }: VehicleGridViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <GridSkeleton />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No vehicles found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {vehicles.map((vehicle) => {
        const daysInService = getDaysInService(vehicle.received_date);
        const isUrgent = daysInService > 7;
        
        return (
          <Link
            key={vehicle.id}
            href={`/dashboard/vehicles/${vehicle.id}`}
            className="block"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Vehicle Image */}
              <div className="relative h-48 bg-muted">
                {vehicle.thumbnail_url ? (
                  <img
                    src={vehicle.thumbnail_url}
                    alt={`${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Car className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {isUrgent && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                    Urgent
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Vehicle Info and Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {vehicle.vehicle_make} {vehicle.vehicle_model}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.vehicle_reg_no || 'No Reg No'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      'font-normal whitespace-nowrap',
                      statusColors[vehicle.status]
                    )}
                  >
                    {statusLabels[vehicle.status] || vehicle.status}
                  </Badge>
                </div>

                {/* Customer */}
                {vehicle.customer && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <User className="h-3 w-3" />
                    <span className="truncate">{vehicle.customer.name}</span>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {/* Days in Service */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className={cn(
                      isUrgent && 'text-red-600 font-semibold'
                    )}>
                      {daysInService} days
                    </span>
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">
                      {formatDistanceToNow(
                        new Date(vehicle.last_activity_at || vehicle.updated_at),
                        { addSuffix: false }
                      )}
                    </span>
                  </div>

                  {/* Technician */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">
                      {vehicle.technician 
                        ? vehicle.technician.name 
                        : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Notes Preview */}
                {vehicle.technician_notes && (
                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                    {vehicle.technician_notes}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
