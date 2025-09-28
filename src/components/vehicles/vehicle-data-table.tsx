'use client';

import React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Camera,
  MessageSquare,
  Phone,
  Printer,
} from 'lucide-react';
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
  _count?: {
    attachments: number;
  };
}

interface VehicleDataTableProps {
  vehicles: VehicleWithCustomer[];
  loading?: boolean;
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800',
  diagnosed: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
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

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function VehicleDataTable({
  vehicles,
  loading,
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortColumn,
  sortDirection,
}: VehicleDataTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      onSort(column, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(column, 'asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('vehicle_info')}
                  className="-ml-3"
                >
                  Vehicle
                  <SortIcon column="vehicle_info" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('customer')}
                  className="-ml-3"
                >
                  Customer
                  <SortIcon column="customer" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="-ml-3"
                >
                  Status
                  <SortIcon column="status" />
                </Button>
              </TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('days_in_service')}
                  className="-ml-3"
                >
                  Days
                  <SortIcon column="days_in_service" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('updated_at')}
                  className="-ml-3"
                >
                  Last Activity
                  <SortIcon column="updated_at" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => {
                const daysInService = getDaysInService(vehicle.received_date);
                const urgencyClass = daysInService > 7 ? 'text-red-600 font-semibold' : '';
                
                return (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <Link 
                        href={`/dashboard/vehicles/${vehicle.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        {vehicle.thumbnail_url ? (
                          <img
                            src={vehicle.thumbnail_url}
                            alt={`${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                            className="h-10 w-10 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {vehicle.vehicle_make} {vehicle.vehicle_model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vehicle.vehicle_reg_no || 'No Reg No'}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {vehicle.customer ? (
                        <Link
                          href={`/dashboard/customers/${vehicle.customer.id}`}
                          className="hover:underline"
                        >
                          {vehicle.customer.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          'font-normal',
                          statusColors[vehicle.status]
                        )}
                      >
                        {statusLabels[vehicle.status] || vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.technician ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/api/avatar/${vehicle.technician.email}`} />
                            <AvatarFallback>
                              {vehicle.technician.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{vehicle.technician.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-sm', urgencyClass)}>
                        {daysInService}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(vehicle.last_activity_at || vehicle.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tickets/${vehicle.service_ticket_id}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Ticket
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Camera className="mr-2 h-4 w-4" />
                            Add Photo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Add Note
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            Contact Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Job Card
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} vehicles
          </p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
