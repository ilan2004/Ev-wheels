'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InvoicePreviewModal } from '@/components/billing/invoices/invoice-preview-modal';
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
  // Color map for clear UX
  const colorMap: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-200',
    [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-800 border-blue-200',
    [InvoiceStatus.PAID]: 'bg-green-100 text-green-800 border-green-200',
    [InvoiceStatus.VOID]: 'bg-red-100 text-red-800 border-red-200',
  } as const;

  return (
    <Badge variant="outline" className={cn('capitalize border', colorMap[status])}>
      {status}
    </Badge>
  );
}

// Compute a numeric priority for sorting rows: lower is higher priority
function computeInvoicePriority(inv: Invoice): number {
  // Paid should always be at the bottom
  if (inv.status === InvoiceStatus.PAID) return 100;
  // Void near the bottom but above paid
  if (inv.status === InvoiceStatus.VOID) return 90;

  const due = inv.dueDate instanceof Date && !isNaN(inv.dueDate.getTime()) ? inv.dueDate : undefined;
  if (!due) return 50; // unknown due date in the middle

  const now = new Date();
  if (isOverdue(due, now as any)) return 0; // highest priority
  // days until due
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return 10; // due soon
  return 20; // due later
}

function InvoiceRowActions({ invoice, onQuickDownload }: { invoice: Invoice; onQuickDownload: (inv: Invoice) => void }) {
  const router = useRouter();
  const [working, setWorking] = React.useState<'markPaid' | 'delete' | null>(null);
  
  const handleView = () => router.push(`/dashboard/invoices/${invoice.id}`);
  const handleEdit = () => router.push(`/dashboard/invoices/${invoice.id}?mode=edit`);
  const handleDelete = async () => {
    try {
      setWorking('delete');
      await toast.promise(
        billingRepository.deleteInvoice(invoice.id),
        {
          loading: 'Deleting invoice…',
          success: 'Invoice deleted',
          error: 'Failed to delete invoice'
        }
      );
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      // toast handled in promise
    } finally {
      setWorking(null);
    }
  };
  
  const handleMarkPaid = async () => {
    try {
      setWorking('markPaid');
      await toast.promise(
        billingRepository.updateInvoice(invoice.id, { status: InvoiceStatus.PAID }),
        {
          loading: 'Marking as paid…',
          success: 'Invoice marked as paid',
          error: 'Failed to update invoice status'
        }
      );
      window.location.reload();
    } catch (error) {
      // toast handled in promise
    } finally {
      setWorking(null);
    }
  };

  const handleAddPayment = () => {
    router.push(`/dashboard/invoices/${invoice.id}/payment`);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Quick actions */}
      {invoice.status !== InvoiceStatus.PAID && (
        <Button aria-label="Mark as Paid" onClick={(e) => { e.stopPropagation(); handleMarkPaid(); }} variant="ghost" size="sm" disabled={working === 'markPaid'} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
          {working === 'markPaid' ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-r-transparent" />
          ) : (
            <IconCreditCard className="h-4 w-4" />
          )}
        </Button>
      )}
      <Button aria-label="Download PDF" onClick={(e) => { e.stopPropagation(); onQuickDownload(invoice); }} variant="ghost" size="sm" className="h-8 w-8 p-0">
        <IconDownload className="h-4 w-4" />
      </Button>

      {/* More menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()} disabled={working !== null}>
            {working === 'delete' ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
              <IconDotsVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(); }}>
            <IconEye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit Invoice
          </DropdownMenuItem>
          {invoice.status !== InvoiceStatus.PAID && (
            <>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAddPayment(); }}>
                <IconCreditCard className="mr-2 h-4 w-4" />
                Add Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkPaid(); }}>
                <IconCreditCard className="mr-2 h-4 w-4" />
                Mark as Paid
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem>
            <IconPrinter className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickDownload(invoice); }}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-destructive">
            <IconTrash className="mr-2 h-4 w-4" />
            Delete Invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function InvoicesListPage() {
  const router = useRouter();
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'priority', desc: false },
    { id: 'dueDate', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Preview modal state for quick download
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const openQuickDownload = (inv: Invoice) => {
    setPreviewInvoice(inv);
    setPreviewOpen(true);
  };
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all' | 'overdue'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const columns: ColumnDef<Invoice>[] = useMemo(() => [
    // Hidden priority column used for sorting
    {
      id: 'priority',
      accessorFn: (row) => computeInvoicePriority(row),
      header: () => null,
      cell: () => null,
      enableHiding: false,
      enableSorting: false,
      enableResizing: false,
      size: 1,
      minSize: 1,
      maxSize: 1,
      meta: { label: 'Priority' },
    },
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        if (!invoice) {
          return <span className="text-muted-foreground">No invoice</span>;
        }
        
        const overdue = invoice.dueDate ? isOverdue(invoice.dueDate) : false;
        const createdAt = invoice.createdAt;
        const hasValidCreatedAt = createdAt instanceof Date && !isNaN(createdAt.getTime());

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{invoice.number || 'No number'}</span>
              {overdue && invoice.status !== InvoiceStatus.PAID && (
                <IconAlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {hasValidCreatedAt ? format(createdAt, 'MMM dd, yyyy') : 'No date'}
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
        if (!customer) {
          return <span className="text-muted-foreground">No customer</span>;
        }
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-medium truncate">{customer.name || 'Unknown'}</span>
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
        const grandTotal = invoice.totals?.grandTotal ?? 0;
        const balanceDue = invoice.balanceDue ?? 0;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {formatCurrency(grandTotal)}
            </span>
            {balanceDue > 0 && balanceDue !== grandTotal && (
              <span className="text-xs text-muted-foreground">
                Due: {formatCurrency(balanceDue)}
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
        const invoice = row.original;
        const dueDate = invoice.dueDate;
        
        const hasValidDueDate = dueDate instanceof Date && !isNaN(dueDate.getTime());
        if (!hasValidDueDate) {
          return <span className="text-muted-foreground">No due date</span>;
        }
        
        const status = formatDueDateStatus(dueDate);
        
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
      cell: ({ row }) => <InvoiceRowActions invoice={row.original} onQuickDownload={openQuickDownload} />,
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
    initialState: {
      columnVisibility: { priority: false },
    },
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
      // Fetch a large page size so the "All Invoices" view shows all items
      const result = await billingRepository.listInvoices(undefined, 1, 1000);
      setData(result.data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const [creating, setCreating] = useState(false);
  const handleCreateInvoice = () => {
    setCreating(true);
    router.push('/dashboard/invoices/new');
    // If navigation does not happen immediately, revert after a short timeout to avoid stuck state
    setTimeout(() => setCreating(false), 2000);
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
          <Button onClick={handleCreateInvoice} className="w-full sm:w-auto" disabled={creating}>
            {creating ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Creating…
              </>
            ) : (
              <>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Invoice
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card onClick={() => setStatusFilter('all')} className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card onClick={() => setStatusFilter(InvoiceStatus.PAID)} className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>
          <Card onClick={() => setStatusFilter(InvoiceStatus.DRAFT)} className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card onClick={() => setStatusFilter('overdue')} className="cursor-pointer">
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
        <DataTable table={table} onRowClick={(row) => router.push(`/dashboard/invoices/${row.original.id}`)} bodyMinHeightClass="min-h-[600px]">
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

        {/* Fallback basic list if all columns are hidden (debug/backup rendering) */}
        {table.getRowModel().rows.length > 0 &&
          table.getAllLeafColumns().every((c) => !c.getIsVisible()) && (
            <div className="mt-4 rounded-md border p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Columns are hidden. Showing a basic list view.
              </p>
              <ul className="space-y-2">
                {data.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between">
                    <span className="font-medium">{inv.number || '(no number)'}</span>
                    <span>{formatCurrency(inv.totals?.grandTotal ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        
        {/* Quick Download Preview Modal */}
        <InvoicePreviewModal invoice={previewInvoice} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      </div>
    </PageContainer>
  );
}
