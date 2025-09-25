'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState
} from '@tanstack/react-table';
import { Invoice, InvoiceStatus, InvoiceFilters } from '@/types/billing';
import { billingRepository } from '@/lib/billing/repository';
import { formatCurrency, formatDueDateStatus, isOverdue } from '@/lib/billing/calculations';
import PageContainer from '@/components/layout/page-container';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  IconPlus, 
  IconDotsVertical, 
  IconEye, 
  IconEdit, 
  IconTrash,
  IconCreditCard,
  IconPrinter,
  IconDownload,
  IconSearch,
  IconFilter,
  IconAlertTriangle
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function getStatusBadge(status: InvoiceStatus) {
  const variants = {
    [InvoiceStatus.DRAFT]: 'secondary',
    [InvoiceStatus.SENT]: 'default', 
    [InvoiceStatus.PAID]: 'secondary',
    [InvoiceStatus.VOID]: 'destructive'
  } as const;
  
  return (
    <Badge variant={variants[status] || 'secondary'} className="capitalize">
      {status}
    </Badge>
  );
}

function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  
  const handleView = () => router.push(`/dashboard/invoices/${invoice.id}`);
  const handleEdit = () => router.push(`/dashboard/invoices/${invoice.id}?mode=edit`);
  const handleDelete = async () => {
    try {
      await billingRepository.deleteInvoice(invoice.id);
      toast.success('Invoice deleted successfully');
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };
  
  const handleMarkPaid = async () => {
    try {
      await billingRepository.updateInvoice(invoice.id, {
        status: InvoiceStatus.PAID
      });
      toast.success('Invoice marked as paid');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleAddPayment = () => {
    router.push(`/dashboard/invoices/${invoice.id}/payment`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <IconDotsVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleView}>
          <IconEye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit Invoice
        </DropdownMenuItem>
        {invoice.status !== InvoiceStatus.PAID && (
          <>
            <DropdownMenuItem onClick={handleAddPayment}>
              <IconCreditCard className="mr-2 h-4 w-4" />
              Add Payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMarkPaid}>
              <IconCreditCard className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem>
          <IconPrinter className="mr-2 h-4 w-4" />
          Print
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconDownload className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <IconTrash className="mr-2 h-4 w-4" />
          Delete Invoice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InvoicesListPage() {
  const router = useRouter();
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all' | 'overdue'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const columns: ColumnDef<Invoice>[] = useMemo(() => [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        const overdue = isOverdue(invoice.dueDate);
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{invoice.number}</span>
              {overdue && invoice.status !== InvoiceStatus.PAID && (
                <IconAlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {format(invoice.createdAt, 'MMM dd, yyyy')}
            </span>
          </div>
        );
      },
      meta: { label: 'Invoice Number' }
    },
    {
      id: 'customer.name',
      accessorFn: (row) => row.customer?.name ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-medium truncate">{customer.name}</span>
            {customer.email && (
              <span className="text-xs text-muted-foreground truncate">
                {customer.email}
              </span>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (!value) return true;
        const name = row.original.customer?.name ?? '';
        return String(name).toLowerCase().includes(String(value).toLowerCase());
      },
      meta: { label: 'Customer' }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
      filterFn: (row, id, value) => {
        if (!value || value === 'all') return true;
        if (value === 'overdue') {
          const invoice = row.original;
          return isOverdue(invoice.dueDate) && invoice.status !== InvoiceStatus.PAID;
        }
        const v = row.getValue(id);
        return Array.isArray(value)
          ? value.includes(v)
          : String(value) === String(v);
      },
      meta: { label: 'Status' }
    },
    {
      id: 'totals.grandTotal',
      accessorFn: (row) => row.totals?.grandTotal ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {formatCurrency(invoice.totals.grandTotal)}
            </span>
            {invoice.balanceDue > 0 && invoice.balanceDue !== invoice.totals.grandTotal && (
              <span className="text-xs text-muted-foreground">
                Due: {formatCurrency(invoice.balanceDue)}
              </span>
            )}
          </div>
        );
      },
      meta: { label: 'Amount' }
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        const status = formatDueDateStatus(dueDate);
        const invoice = row.original;
        
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {format(dueDate, 'MMM dd, yyyy')}
            </span>
            {invoice.status !== InvoiceStatus.PAID && (
              <span className={cn(
                "text-xs",
                status.status === 'overdue' && "text-destructive",
                status.status === 'due-soon' && "text-warning",
                status.status === 'due-later' && "text-muted-foreground"
              )}>
                {status.message}
              </span>
            )}
          </div>
        );
      },
      meta: { label: 'Due Date' }
    },
    {
      id: 'actions',
      cell: ({ row }) => <InvoiceRowActions invoice={row.original} />,
      meta: { label: 'Actions' }
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    // Apply filters
    const filters: ColumnFiltersState = [];
    
    if (statusFilter !== 'all') {
      filters.push({ id: 'status', value: statusFilter });
    }
    
    if (searchFilter) {
      filters.push({ id: 'customer.name', value: searchFilter });
    }
    
    setColumnFilters(filters);
  }, [statusFilter, searchFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = await billingRepository.listInvoices();
      setData(result.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    router.push('/dashboard/invoices/new');
  };


  // Calculate stats
  const stats = useMemo(() => {
    const totalValue = data.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);
    const paidValue = data
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);
    const outstandingValue = data
      .filter(inv => inv.status !== InvoiceStatus.PAID)
      .reduce((sum, invoice) => sum + invoice.balanceDue, 0);
    const overdueCount = data.filter(inv => 
      isOverdue(inv.dueDate) && inv.status !== InvoiceStatus.PAID
    ).length;
    
    return {
      total: data.length,
      draft: data.filter(inv => inv.status === InvoiceStatus.DRAFT).length,
      sent: data.filter(inv => inv.status === InvoiceStatus.SENT).length,
      paid: data.filter(inv => inv.status === InvoiceStatus.PAID).length,
      overdue: overdueCount,
      totalValue,
      paidValue,
      outstandingValue
    };
  }, [data]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Manage your invoices and track payments.
            </p>
          </div>
          <Button onClick={handleCreateInvoice} className="w-full sm:w-auto">
            <IconPlus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <div className="text-xs text-muted-foreground">
                Outstanding: {formatCurrency(stats.outstandingValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable table={table}>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  className="pl-8"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'all' | 'overdue')}>
                <SelectTrigger className="w-full sm:w-36">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={InvoiceStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={InvoiceStatus.SENT}>Sent</SelectItem>
                  <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value={InvoiceStatus.VOID}>Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DataTableViewOptions table={table} />
          </div>
        </DataTable>
      </div>
    </PageContainer>
  );
}
