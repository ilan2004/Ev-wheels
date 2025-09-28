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
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
};

const statusLabels: Record<string, string> = {
  received: 'Received',
  diagnosed: 'Diagnosed',
  in_progress: 'In Progress',
  completed: 'Completed',
  delivered: 'Delivered',
  on_hold: 'On Hold',
  cancelled: 'Cancelled'
};

function getDaysInService(receivedDate: string): number {
  return Math.floor(
    (Date.now() - new Date(receivedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function GridSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className='overflow-hidden'>
          <Skeleton className='h-48 w-full' />
          <CardContent className='p-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-6 w-20 rounded-full' />
              </div>
              <Skeleton className='h-4 w-24' />
              <div className='space-y-2 pt-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
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
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        <GridSkeleton />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className='text-muted-foreground py-12 text-center'>
        No vehicles found
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {vehicles.map((vehicle) => {
        const daysInService = getDaysInService(vehicle.received_date);
        const isUrgent = daysInService > 7;

        return (
          <Link
            key={vehicle.id}
            href={`/dashboard/vehicles/${vehicle.id}`}
            className='block'
          >
            <Card className='overflow-hidden transition-shadow duration-200 hover:shadow-lg'>
              {/* Vehicle Image */}
              <div className='bg-muted relative h-48'>
                {vehicle.thumbnail_url ? (
                  <img
                    src={vehicle.thumbnail_url}
                    alt={`${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                    className='h-full w-full object-cover'
                    loading='lazy'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <Car className='text-muted-foreground h-12 w-12' />
                  </div>
                )}
                {isUrgent && (
                  <div className='absolute top-2 right-2 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white'>
                    Urgent
                  </div>
                )}
              </div>

              <CardContent className='p-4'>
                {/* Vehicle Info and Status */}
                <div className='mb-2 flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate text-base font-semibold'>
                      {vehicle.vehicle_make} {vehicle.vehicle_model}
                    </h3>
                    <p className='text-muted-foreground text-sm'>
                      {vehicle.vehicle_reg_no || 'No Reg No'}
                    </p>
                  </div>
                  <Badge
                    variant='secondary'
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
                  <div className='text-muted-foreground mb-3 flex items-center gap-2 text-sm'>
                    <User className='h-3 w-3' />
                    <span className='truncate'>{vehicle.customer.name}</span>
                  </div>
                )}

                {/* Details Grid */}
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  {/* Days in Service */}
                  <div className='flex items-center gap-1.5'>
                    <Calendar className='text-muted-foreground h-3 w-3' />
                    <span
                      className={cn(isUrgent && 'font-semibold text-red-600')}
                    >
                      {daysInService} days
                    </span>
                  </div>

                  {/* Last Activity */}
                  <div className='flex items-center gap-1.5'>
                    <Clock className='text-muted-foreground h-3 w-3' />
                    <span className='truncate'>
                      {formatDistanceToNow(
                        new Date(
                          vehicle.last_activity_at || vehicle.updated_at
                        ),
                        { addSuffix: false }
                      )}
                    </span>
                  </div>

                  {/* Technician */}
                  <div className='col-span-2 flex items-center gap-1.5'>
                    <Wrench className='text-muted-foreground h-3 w-3' />
                    <span className='truncate'>
                      {vehicle.technician
                        ? vehicle.technician.name
                        : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Notes Preview */}
                {vehicle.technician_notes && (
                  <p className='text-muted-foreground mt-3 line-clamp-2 text-xs'>
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
