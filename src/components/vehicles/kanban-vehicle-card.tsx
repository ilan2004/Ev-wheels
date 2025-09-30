'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VehicleCase, VehicleStatus } from '@/lib/types/service-tickets';
import {
  GripVertical,
  MoreVertical,
  Eye,
  FileText,
  MessageSquare,
  Camera,
  Clock,
  AlertCircle,
  Car,
  Zap,
  AlertTriangle
} from 'lucide-react';

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
  _dragHandleProps?: any;
}

interface KanbanVehicleCardProps {
  vehicle: VehicleWithCustomer;
  isDragging?: boolean;
  dragHandleProps?: any;
}

function getDaysInService(receivedDate: string): number {
  return Math.floor(
    (Date.now() - new Date(receivedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
}

// Dynamic styling based on status and urgency
function getCardStyle(
  status: VehicleStatus,
  isUrgent: boolean,
  isCritical: boolean
) {
  const baseClasses =
    'relative overflow-hidden transition-all duration-300 group';

  const statusStyles: Record<VehicleStatus, string> = {
    received:
      'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400',
    diagnosed:
      'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:border-purple-400',
    in_progress:
      'bg-gradient-to-br from-amber-50 to-yellow-100/50 border-yellow-300 hover:border-yellow-500',
    completed:
      'bg-gradient-to-br from-emerald-50 to-green-100/50 border-green-300 hover:border-green-500',
    delivered:
      'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-300 hover:border-gray-400',
    on_hold:
      'bg-gradient-to-br from-red-50 to-orange-100/50 border-red-200 hover:border-red-400',
    cancelled:
      'bg-gradient-to-br from-gray-100 to-gray-200/50 border-gray-400 hover:border-gray-500'
  };

  let urgencyClass = '';
  if (isCritical) {
    urgencyClass = 'ring-2 ring-red-500 ring-offset-2 animate-pulse';
  } else if (isUrgent) {
    urgencyClass = 'ring-1 ring-orange-400 ring-offset-1';
  }

  return cn(
    baseClasses,
    statusStyles[status] || statusStyles.received,
    urgencyClass
  );
}

// Priority indicator based on days
function getPriorityLevel(days: number): {
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
} {
  if (days > 10)
    return {
      level: 'critical',
      color: 'text-red-600 bg-red-100',
      icon: AlertTriangle
    };
  if (days > 7)
    return {
      level: 'high',
      color: 'text-orange-600 bg-orange-100',
      icon: AlertCircle
    };
  if (days > 3)
    return {
      level: 'medium',
      color: 'text-yellow-600 bg-yellow-100',
      icon: Clock
    };
  return { level: 'low', color: 'text-green-600 bg-green-100' };
}

export function KanbanVehicleCard({
  vehicle,
  isDragging,
  dragHandleProps
}: KanbanVehicleCardProps) {
  const daysInService = getDaysInService(vehicle.received_date);
  const priority = getPriorityLevel(daysInService);
  const isUrgent = daysInService > 7;
  const isCritical = daysInService > 10;

  return (
    <Card
      className={cn(
        getCardStyle(vehicle.status, isUrgent, isCritical),
        'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
        isDragging && 'z-50 scale-110 rotate-3 opacity-70 shadow-2xl'
      )}
    >
      {/* Priority Indicator Strip */}
      {priority.level !== 'low' && (
        <div
          className={cn(
            'absolute top-0 right-0 left-0 h-1 bg-gradient-to-r',
            priority.level === 'critical' && 'from-red-500 to-red-600',
            priority.level === 'high' && 'from-orange-400 to-orange-500',
            priority.level === 'medium' && 'from-yellow-400 to-yellow-500'
          )}
        />
      )}
      <div className='relative space-y-3 p-3'>
        {/* Header with drag handle */}
        <div className='flex items-start gap-2'>
          <div
            {...dragHandleProps}
            className='mt-1 cursor-grab opacity-50 transition-opacity hover:opacity-100 active:cursor-grabbing'
          >
            <GripVertical className='text-muted-foreground h-4 w-4' />
          </div>

          <div className='min-w-0 flex-1'>
            {/* Vehicle Info */}
            <Link
              href={`/dashboard/vehicles/${vehicle.id}`}
              className='group/link block'
            >
              <h4 className='group-hover/link:text-primary truncate text-sm font-semibold transition-colors'>
                {vehicle.vehicle_make} {vehicle.vehicle_model}
              </h4>
              <p className='text-muted-foreground mt-0.5 text-xs font-medium'>
                {vehicle.vehicle_reg_no || 'No Reg'}
              </p>
            </Link>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                  <Eye className='mr-2 h-3 w-3' />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/job-cards/${vehicle.service_ticket_id}`}>
                  <FileText className='mr-2 h-3 w-3' />
                  View Job Card
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <MessageSquare className='mr-2 h-3 w-3' />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Camera className='mr-2 h-3 w-3' />
                Add Photo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer */}
        {vehicle.customer && (
          <div className='flex items-center justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <span className='text-foreground/80 block truncate text-xs font-medium'>
                {vehicle.customer.name}
              </span>
              {vehicle.customer.contact && (
                <span className='text-muted-foreground text-[10px]'>
                  {vehicle.customer.contact}
                </span>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant={
                      priority.level === 'critical'
                        ? 'destructive'
                        : priority.level === 'high'
                          ? 'default'
                          : 'secondary'
                    }
                    className={cn(
                      'flex h-5 items-center gap-1 px-2 text-xs font-semibold',
                      priority.color
                    )}
                  >
                    {priority.icon && <priority.icon className='h-3 w-3' />}
                    {daysInService}d
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>In service for {daysInService} days</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Priority: {priority.level}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Vehicle Image or Placeholder */}
        <div className='from-muted/30 to-muted/50 relative h-24 overflow-hidden rounded-lg bg-gradient-to-br shadow-inner'>
          {vehicle.thumbnail_url ? (
            <img
              src={vehicle.thumbnail_url}
              alt={`${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
              className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-110'
              loading='lazy'
            />
          ) : (
            <div className='from-muted/50 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br'>
              <Car className='text-muted-foreground/50 h-8 w-8' />
            </div>
          )}

          {/* Service Ticket Number Overlay */}
          <div className='bg-background/90 absolute right-1 bottom-1 rounded px-1.5 py-0.5 font-mono text-[10px] backdrop-blur-sm'>
            #{vehicle.service_ticket_id?.slice(0, 8) || vehicle.id.slice(0, 8)}
          </div>
        </div>

        {/* Footer with technician and time */}
        <div className='space-y-2'>
          {/* Technician Assignment */}
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
              Assigned to
            </span>
            {vehicle.technician ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className='bg-background/50 flex items-center gap-1.5 rounded-full px-2 py-1'>
                      <Avatar className='ring-background h-5 w-5 ring-2'>
                        <AvatarImage
                          src={`/api/avatar/${vehicle.technician.email}`}
                        />
                        <AvatarFallback className='bg-primary text-primary-foreground text-[9px]'>
                          {vehicle.technician.name
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className='max-w-[80px] truncate text-xs font-medium'>
                        {vehicle.technician.name.split(' ')[0]}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{vehicle.technician.name}</p>
                    <p className='text-muted-foreground text-xs'>
                      {vehicle.technician.email}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge
                variant='outline'
                className='h-5 border-yellow-200 bg-yellow-50 px-2 text-[10px] text-yellow-700'
              >
                <AlertCircle className='mr-1 h-3 w-3' />
                Unassigned
              </Badge>
            )}
          </div>

          {/* Last Activity */}
          {vehicle.last_activity_at && (
            <div className='text-muted-foreground flex items-center gap-1 text-[10px]'>
              <Zap className='h-3 w-3' />
              <span>
                Last activity:{' '}
                {new Date(vehicle.last_activity_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Notes preview if available */}
        {vehicle.technician_notes && (
          <div className='bg-muted/50 mt-2 rounded-md p-2'>
            <p className='text-muted-foreground line-clamp-2 text-[11px]'>
              <span className='font-medium'>Note:</span>{' '}
              {vehicle.technician_notes}
            </p>
          </div>
        )}

        {/* Status Indicator - Bottom of card */}
        <div className='absolute right-0 bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-50' />
      </div>
    </Card>
  );
}
