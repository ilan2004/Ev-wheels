'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import { ConnectedCase } from '@/lib/types/service-tickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  IconCar,
  IconBattery,
  IconEye,
  IconCalendar,
  IconUser,
  IconMapPin,
  IconRefresh
} from '@tabler/icons-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Status color mapping
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    reported: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    triaged:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_progress:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    delivered:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    on_hold:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    waiting_approval:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    received:
      'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    diagnosed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
  };

  return (
    colorMap[status] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  );
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function ConnectedCasesPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const page = 1; // Currently only showing first page
  const limit = 20;

  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: [
      'connected-cases',
      page,
      limit,
      statusFilter === 'all' ? undefined : statusFilter
    ],
    queryFn: async () => {
      return await serviceTicketsApi.listConnectedCases({
        limit,
        offset: (page - 1) * limit,
        status: statusFilter === 'all' ? undefined : (statusFilter as any)
      });
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  });

  // Filter by search term (client-side for simplicity)
  const filteredCases = React.useMemo(() => {
    const connectedCases = response?.data || [];
    if (!searchTerm.trim()) return connectedCases;

    return connectedCases.filter(
      (case_) =>
        case_.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.vehicleCase?.regNo
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        case_.batteryCase?.serial
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [response?.data, searchTerm]);

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <div className='text-center'>
          <p className='mb-4 text-red-600'>Failed to load connected cases</p>
          <Button onClick={handleRefresh} variant='outline'>
            <IconRefresh className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Connected Cases</h1>
          <p className='text-muted-foreground'>
            Service tickets with both vehicle and battery cases
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          variant='outline'
          disabled={isRefetching}
          className='shrink-0'
        >
          <IconRefresh
            className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='flex-1'>
          <Input
            placeholder='Search by ticket number, customer, vehicle reg, or battery serial...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='max-w-md'
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='reported'>Reported</SelectItem>
            <SelectItem value='triaged'>Triaged</SelectItem>
            <SelectItem value='in_progress'>In Progress</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
            <SelectItem value='delivered'>Delivered</SelectItem>
            <SelectItem value='closed'>Closed</SelectItem>
            <SelectItem value='cancelled'>Cancelled</SelectItem>
            <SelectItem value='on_hold'>On Hold</SelectItem>
            <SelectItem value='waiting_approval'>Waiting Approval</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader>
                <div className='mb-2 h-4 w-3/4 rounded bg-gray-200'></div>
                <div className='h-3 w-1/2 rounded bg-gray-200'></div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='h-3 rounded bg-gray-200'></div>
                  <div className='h-3 w-2/3 rounded bg-gray-200'></div>
                  <div className='h-8 rounded bg-gray-200'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cases Grid */}
      {!isLoading && (
        <>
          {filteredCases.length === 0 ? (
            <div className='py-12 text-center'>
              <div className='text-muted-foreground mb-4'>
                {searchTerm
                  ? 'No connected cases match your search'
                  : 'No connected cases found'}
              </div>
              {searchTerm && (
                <Button variant='outline' onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className='text-muted-foreground mb-4 text-sm'>
                Showing {filteredCases.length} connected case
                {filteredCases.length === 1 ? '' : 's'}
                {searchTerm && ` matching "${searchTerm}"`}
              </div>

              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {filteredCases.map((connectedCase) => (
                  <ConnectedCaseCard
                    key={connectedCase.ticketId}
                    connectedCase={connectedCase}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Pagination would go here if needed */}
    </div>
  );
}

interface ConnectedCaseCardProps {
  connectedCase: ConnectedCase;
}

function ConnectedCaseCard({ connectedCase }: ConnectedCaseCardProps) {
  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold'>
              {connectedCase.ticketNumber}
            </CardTitle>
            <Badge
              className={cn('mt-1', getStatusColor(connectedCase.ticketStatus))}
            >
              {formatStatus(connectedCase.ticketStatus)}
            </Badge>
          </div>

          <Link href={`/dashboard/tickets/${connectedCase.ticketId}`}>
            <Button size='sm' variant='outline'>
              <IconEye className='mr-1 h-4 w-4' />
              View
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Customer Info */}
        {connectedCase.customer && (
          <div className='flex items-center gap-2'>
            <IconUser className='text-muted-foreground h-4 w-4' />
            <span className='text-sm font-medium'>
              {connectedCase.customer.name}
            </span>
            {connectedCase.customer.contact && (
              <span className='text-muted-foreground text-xs'>
                • {connectedCase.customer.contact}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {connectedCase.location && (
          <div className='flex items-center gap-2'>
            <IconMapPin className='text-muted-foreground h-4 w-4' />
            <span className='text-sm'>{connectedCase.location.name}</span>
            {connectedCase.location.code && (
              <span className='text-muted-foreground text-xs'>
                ({connectedCase.location.code})
              </span>
            )}
          </div>
        )}

        {/* Vehicle Case */}
        {connectedCase.vehicleCase && (
          <div className='rounded-md border bg-blue-50/50 p-3 dark:bg-blue-950/10'>
            <div className='mb-2 flex items-center gap-2'>
              <IconCar className='h-4 w-4 text-blue-600' />
              <span className='text-sm font-medium'>Vehicle Case</span>
              <Badge
                variant='outline'
                className={cn(
                  'text-xs',
                  getStatusColor(connectedCase.vehicleCase.status)
                )}
              >
                {formatStatus(connectedCase.vehicleCase.status)}
              </Badge>
            </div>
            <div className='space-y-1 text-sm'>
              <div className='font-mono'>{connectedCase.vehicleCase.regNo}</div>
              {(connectedCase.vehicleCase.make ||
                connectedCase.vehicleCase.model) && (
                <div className='text-muted-foreground'>
                  {[
                    connectedCase.vehicleCase.make,
                    connectedCase.vehicleCase.model
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </div>
              )}
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <IconCalendar className='h-3 w-3' />
                {format(
                  new Date(connectedCase.vehicleCase.receivedDate),
                  'MMM dd, yyyy'
                )}
              </div>
            </div>
            <div className='mt-2'>
              <Link
                href={`/dashboard/vehicles/${connectedCase.vehicleCase.id}`}
              >
                <Button size='sm' variant='outline'>
                  View Vehicle
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Battery Case */}
        {connectedCase.batteryCase && (
          <div className='rounded-md border bg-green-50/50 p-3 dark:bg-green-950/10'>
            <div className='mb-2 flex items-center gap-2'>
              <IconBattery className='h-4 w-4 text-green-600' />
              <span className='text-sm font-medium'>Battery Case</span>
              <Badge
                variant='outline'
                className={cn(
                  'text-xs',
                  getStatusColor(connectedCase.batteryCase.status)
                )}
              >
                {formatStatus(connectedCase.batteryCase.status)}
              </Badge>
            </div>
            <div className='space-y-1 text-sm'>
              <div className='font-mono'>
                {connectedCase.batteryCase.serial}
              </div>
              {connectedCase.batteryCase.packType && (
                <div className='text-muted-foreground'>
                  {connectedCase.batteryCase.packType}
                </div>
              )}
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <IconCalendar className='h-3 w-3' />
                {format(
                  new Date(connectedCase.batteryCase.receivedDate),
                  'MMM dd, yyyy'
                )}
              </div>
            </div>
            <div className='mt-2'>
              <Link
                href={`/dashboard/batteries/${connectedCase.batteryCase.id}`}
              >
                <Button size='sm' variant='outline'>
                  View Battery
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className='text-muted-foreground border-t pt-2 text-xs'>
          <div>
            Created:{' '}
            {format(new Date(connectedCase.createdAt), 'MMM dd, yyyy HH:mm')}
          </div>
          {connectedCase.updatedAt !== connectedCase.createdAt && (
            <div>
              Updated:{' '}
              {format(new Date(connectedCase.updatedAt), 'MMM dd, yyyy HH:mm')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
