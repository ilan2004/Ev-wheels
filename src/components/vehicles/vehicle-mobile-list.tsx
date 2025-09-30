'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

// Minimal vehicle shape needed for mobile list rendering
interface VehicleItem {
  id: string;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_reg_no?: string | null;
  thumbnail_url?: string | null;
  status: string;
  customer?: { id: string; name: string } | null;
  technician?: { name: string; email: string } | null;
  updated_at?: string;
  last_activity_at?: string | null;
  received_date: string;
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800',
  diagnosed: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600'
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

function ListSkeleton() {
  return (
    <div className='space-y-3'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className='flex items-center gap-3 p-3'>
            <Skeleton className='h-14 w-14 rounded' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-4 w-12' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function VehicleMobileList({
  vehicles,
  loading
}: {
  vehicles: VehicleItem[];
  loading?: boolean;
}) {
  if (loading) return <ListSkeleton />;
  if (!vehicles?.length) {
    return (
      <div className='text-muted-foreground py-8 text-center text-sm'>
        No vehicles found
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {vehicles.map((v) => (
        <Card key={v.id} className='shadow-sm'>
          <CardContent className='p-3'>
            <Link
              href={`/dashboard/vehicles/${v.id}`}
              className='flex items-center gap-3'
            >
              {v.thumbnail_url ? (
                <img
                  src={v.thumbnail_url}
                  alt={
                    `${v.vehicle_make || ''} ${v.vehicle_model || ''}`.trim() ||
                    'Vehicle'
                  }
                  className='h-14 w-14 flex-shrink-0 rounded object-cover'
                  loading='lazy'
                />
              ) : (
                <div className='bg-muted flex h-14 w-14 flex-shrink-0 items-center justify-center rounded'>
                  <Camera className='text-muted-foreground h-5 w-5' />
                </div>
              )}

              <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='truncate font-medium'>
                    {(v.vehicle_make || '') + ' ' + (v.vehicle_model || '')}
                  </div>
                  <Badge
                    variant='secondary'
                    className={cn(
                      'font-normal whitespace-nowrap',
                      statusColors[v.status]
                    )}
                  >
                    {statusLabels[v.status] || v.status}
                  </Badge>
                </div>
                <div className='text-muted-foreground truncate text-xs'>
                  {v.vehicle_reg_no || 'No Reg No'}
                </div>
                <div className='mt-1 flex items-center justify-between gap-2 text-xs'>
                  <div className='truncate'>
                    {v.customer ? (
                      <span>
                        Customer:{' '}
                        <span className='text-foreground'>
                          {v.customer.name}
                        </span>
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>No customer</span>
                    )}
                  </div>
                  {v.technician ? (
                    <div className='flex flex-shrink-0 items-center gap-1'>
                      <Avatar className='h-5 w-5'>
                        <AvatarImage
                          src={`/api/avatar/${v.technician.email}`}
                        />
                        <AvatarFallback>
                          {v.technician.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-muted-foreground max-w-[100px] truncate'>
                        {v.technician.name}
                      </span>
                    </div>
                  ) : (
                    <span className='text-muted-foreground flex-shrink-0'>
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className='text-muted-foreground h-4 w-4 flex-shrink-0' />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
