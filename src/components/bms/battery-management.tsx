'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/layout/section-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  IconPlus,
  IconSearch,
  IconDownload,
  IconDots,
  IconEye,
  IconEdit,
  IconTrash,
  IconQrcode,
  IconPrinter
} from '@tabler/icons-react';
import { BatteryRecord, BatteryStatus } from '@/types/bms';
import { batteryApi } from '@/lib/api/batteries';

const getStatusColor = (status: BatteryStatus): string => {
  switch (status) {
    case BatteryStatus.RECEIVED:
      return 'bg-blue-100 text-blue-800';
    case BatteryStatus.DIAGNOSED:
      return 'bg-yellow-100 text-yellow-800';
    case BatteryStatus.IN_PROGRESS:
      return 'bg-orange-100 text-orange-800';
    case BatteryStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case BatteryStatus.DELIVERED:
      return 'bg-gray-100 text-gray-800';
    case BatteryStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    case BatteryStatus.ON_HOLD:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: BatteryStatus): string => {
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatCurrency = (amount?: number): string => {
  if (!amount) return '-';
  return `₹${amount.toLocaleString('en-IN')}`;
};

export function BatteryManagement() {
  const [batteries, setBatteries] = useState<BatteryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchBatteries = async () => {
      const res = await batteryApi.listBatteries({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        brand: brandFilter !== 'all' ? brandFilter : undefined,
        limit: 200
      });
      if (res.success && res.data) {
        setBatteries(res.data);
      }
    };
    fetchBatteries();
  }, [searchTerm, statusFilter, brandFilter]);

  const filteredBatteries = batteries.filter((battery) => {
    const matchesSearch =
      battery.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battery.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battery.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || battery.status === statusFilter;
    const matchesBrand = brandFilter === 'all' || battery.brand === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  const uniqueBrands = Array.from(new Set(batteries.map((b) => b.brand)));

  return (
    <div className='mx-auto w-full max-w-7xl space-y-6'>
      {/* Header */}
      <SectionHeader
        title='Battery Management'
        description='Track and manage battery repairs, diagnostics, and service records'
        actions={
          <>
            <Button
              variant='outline'
              size='default'
              className='flex-1 sm:flex-initial'
            >
              <IconDownload className='mr-2 h-4 w-4' />
              <span className='hidden sm:inline'>Export</span>
              <span className='sm:hidden'>Export</span>
            </Button>
            <Button
              onClick={() =>
                (window.location.href = '/dashboard/batteries/new')
              }
              size='default'
              className='flex-1 sm:flex-initial'
            >
              <IconPlus className='mr-2 h-4 w-4' />
              Add Battery
            </Button>
          </>
        }
      />

      {/* Key Metrics */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <Card className='border-primary/30 border-t-2 transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Batteries
            </CardTitle>
            <IconQrcode className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{batteries.length}</div>
            <p className='text-muted-foreground text-xs'>
              Active battery records
            </p>
          </CardContent>
        </Card>

        <Card className='border-primary/30 border-t-2 transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
            <IconEdit className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {
                batteries.filter((b) => b.status === BatteryStatus.IN_PROGRESS)
                  .length
              }
            </div>
            <p className='text-muted-foreground text-xs'>
              Currently being repaired
            </p>
          </CardContent>
        </Card>

        <Card className='border-primary/30 border-t-2 transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
            <IconEye className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {
                batteries.filter((b) => b.status === BatteryStatus.COMPLETED)
                  .length
              }
            </div>
            <p className='text-muted-foreground text-xs'>Ready for delivery</p>
          </CardContent>
        </Card>

        <Card className='border-primary/30 border-t-2 transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <span className='text-muted-foreground font-bold'>₹</span>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(
                batteries.reduce((sum, b) => sum + (b.final_cost || 0), 0)
              )}
            </div>
            <p className='text-muted-foreground text-xs'>
              From completed repairs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className='overflow-hidden'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-lg sm:text-xl'>Battery Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-6 flex flex-col gap-3 lg:flex-row'>
            <div className='min-w-0 flex-1'>
              <div className='relative'>
                <IconSearch className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search by serial, customer, or brand...'
                  className='w-full pl-9'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='All Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  {Object.values(BatteryStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='All Brands' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Brands</SelectItem>
                  {uniqueBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Card View */}
          {isMobile ? (
            <div className='space-y-4'>
              {filteredBatteries.map((battery) => (
                <Card
                  key={battery.id}
                  className='transition-shadow hover:shadow-md'
                >
                  <CardContent className='p-4'>
                    <div className='mb-3 flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='text-muted-foreground mb-1 font-mono text-xs font-semibold'>
                          {battery.serial_number}
                        </p>
                        <p className='text-base font-semibold'>
                          {battery.customer?.name}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {battery.customer?.contact || 'No contact'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                          >
                            <IconDots className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-48'>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/dashboard/batteries/${battery.id}`)
                            }
                          >
                            <IconEye className='mr-2 h-4 w-4' />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconEdit className='mr-2 h-4 w-4' />
                            Edit Battery
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <IconQrcode className='mr-2 h-4 w-4' />
                            Generate QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconPrinter className='mr-2 h-4 w-4' />
                            Print Label
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-red-600 focus:text-red-600'>
                            <IconTrash className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='mb-3 grid grid-cols-2 gap-3'>
                      <div>
                        <p className='text-muted-foreground mb-1 text-xs'>
                          Brand & Type
                        </p>
                        <p className='text-sm font-medium'>{battery.brand}</p>
                        <p className='text-muted-foreground text-xs'>
                          {battery.voltage}V {battery.capacity}Ah •{' '}
                          {battery.battery_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground mb-1 text-xs'>
                          Received
                        </p>
                        <p className='text-sm'>
                          {new Date(battery.received_date).toLocaleDateString(
                            'en-IN'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-end justify-between'>
                      <Badge
                        className={`${getStatusColor(battery.status)} text-xs`}
                      >
                        {formatStatus(battery.status)}
                      </Badge>
                      <div className='text-right'>
                        <p className='text-sm font-semibold'>
                          {formatCurrency(battery.final_cost)}
                        </p>
                        {battery.estimated_cost &&
                          battery.final_cost !== battery.estimated_cost && (
                            <p className='text-muted-foreground text-xs'>
                              Est: {formatCurrency(battery.estimated_cost)}
                            </p>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div className='overflow-hidden rounded-lg border'>
              <div className='table-container overflow-x-auto'>
                <Table>
                  <TableHeader className='bg-muted sticky top-0 z-10'>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='min-w-[200px] font-semibold'>
                        Serial Number
                      </TableHead>
                      <TableHead className='min-w-[150px] font-semibold'>
                        Customer
                      </TableHead>
                      <TableHead className='min-w-[140px] font-semibold'>
                        Brand & Type
                      </TableHead>
                      <TableHead className='min-w-[120px] font-semibold'>
                        Status
                      </TableHead>
                      <TableHead className='min-w-[110px] font-semibold'>
                        Location
                      </TableHead>
                      <TableHead className='min-w-[110px] font-semibold'>
                        Received
                      </TableHead>
                      <TableHead className='min-w-[120px] font-semibold'>
                        Cost
                      </TableHead>
                      <TableHead className='w-[50px]'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatteries.map((battery, idx) => (
                      <TableRow
                        key={battery.id}
                        className='hover:bg-muted/50 odd:bg-background even:bg-muted/30 transition-colors'
                      >
                        <TableCell className='py-4 font-medium'>
                          <div className='space-y-1'>
                            <p
                              className='max-w-[200px] truncate font-mono text-sm font-semibold'
                              title={battery.serial_number}
                            >
                              {battery.serial_number.length > 20
                                ? `${battery.serial_number.slice(0, 20)}...`
                                : battery.serial_number}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {battery.voltage}V {battery.capacity}Ah
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className='py-4'>
                          <div className='space-y-1'>
                            <p
                              className='font-medium'
                              title={battery.customer?.name}
                            >
                              {battery.customer?.name}
                            </p>
                            <p
                              className='text-muted-foreground text-xs'
                              title={battery.customer?.contact}
                            >
                              {battery.customer?.contact || 'No contact'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className='py-4'>
                          <div className='space-y-1'>
                            <p className='font-medium' title={battery.brand}>
                              {battery.brand}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {battery.battery_type.replace('_', ' ')}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {battery.cell_type}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className='py-4'>
                          <Badge
                            className={`${getStatusColor(battery.status)} whitespace-nowrap`}
                          >
                            {formatStatus(battery.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className='py-4'>
                          {battery.location?.name ? (
                            <Badge variant='outline' className='text-xs'>
                              {battery.location.name}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground text-xs'>
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='py-4'>
                          <span className='text-sm'>
                            {new Date(battery.received_date).toLocaleDateString(
                              'en-IN'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className='py-4'>
                          <div className='space-y-1'>
                            <p className='text-sm font-semibold'>
                              {formatCurrency(battery.final_cost)}
                            </p>
                            {battery.estimated_cost &&
                              battery.final_cost !== battery.estimated_cost && (
                                <p className='text-muted-foreground text-xs'>
                                  Est: {formatCurrency(battery.estimated_cost)}
                                </p>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className='py-4'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                title='More actions'
                              >
                                <IconDots className='h-4 w-4' />
                                <span className='sr-only'>Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  (window.location.href = `/dashboard/batteries/${battery.id}`)
                                }
                              >
                                <IconEye className='mr-2 h-4 w-4' />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEdit className='mr-2 h-4 w-4' />
                                Edit Battery
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <IconQrcode className='mr-2 h-4 w-4' />
                                Generate QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconPrinter className='mr-2 h-4 w-4' />
                                Print Label
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='text-red-600 focus:text-red-600'>
                                <IconTrash className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {filteredBatteries.length === 0 && (
            <div className='space-y-3 py-12 text-center'>
              <p className='text-muted-foreground text-sm'>
                No batteries found matching your criteria
              </p>
              <div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setBrandFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
