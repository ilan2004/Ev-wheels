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
import { Quote, QuoteStatus, QuoteFilters } from '@/types/billing';
import { billingRepository } from '@/lib/billing/repository';
import { formatCurrency, formatDueDateStatus } from '@/lib/billing/calculations';
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
  IconReceipt,
  IconPrinter,
  IconDownload,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function getStatusBadge(status: QuoteStatus) {
  const variants = {
    [QuoteStatus.DRAFT]: 'secondary',
    [QuoteStatus.SENT]: 'default', 
    [QuoteStatus.EXPIRED]: 'destructive'
  } as const;
  
  return (
    <Badge variant={variants[status]} className="capitalize">
      {status}
    </Badge>
  );
}

function QuoteRowActions({ quote }: { quote: Quote }) {
  const router = useRouter();
  
  const handleView = () => router.push(`/dashboard/quotes/${quote.id}`);
  const handleEdit = () => router.push(`/dashboard/quotes/${quote.id}?mode=edit`);
  const handleDelete = async () => {
    try {
      await billingRepository.deleteQuote(quote.id);
      toast.success('Quote deleted successfully');
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };
  
  const handleConvertToInvoice = () => {
    router.push(`/dashboard/invoices/new?fromQuote=${quote.id}`);
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
          Edit Quote
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleConvertToInvoice}>
          <IconReceipt className="mr-2 h-4 w-4" />
          Convert to Invoice
        </DropdownMenuItem>
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
          Delete Quote
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuotesListPage() {
  const router = useRouter();
  const [data, setData] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const columns: ColumnDef<Quote>[] = useMemo(() => [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quote #" />
      ),
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{quote.number}</span>
            <span className="text-xs text-muted-foreground">
              {format(quote.createdAt, 'MMM dd, yyyy')}
            </span>
          </div>
        );
      },
      meta: { label: 'Quote Number' }
    },
    {
      accessorKey: 'customer.name',
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
      meta: { label: 'Customer' }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
      filterFn: (row, id, value) => {
        return value === 'all' || value.includes(row.getValue(id));
      },
      meta: { label: 'Status' }
    },
    {
      accessorKey: 'totals.grandTotal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue('totals.grandTotal') as number;
        return (
          <span className="font-medium">
            {formatCurrency(amount)}
          </span>
        );
      },
      meta: { label: 'Amount' }
    },
    {
      accessorKey: 'validUntil',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valid Until" />
      ),
      cell: ({ row }) => {
        const validUntil = row.original.validUntil;
        if (!validUntil) return <span className="text-muted-foreground">-</span>;
        
        const status = formatDueDateStatus(validUntil);
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {format(validUntil, 'MMM dd, yyyy')}
            </span>
            <span className={cn(
              "text-xs",
              status.status === 'overdue' && "text-destructive",
              status.status === 'due-soon' && "text-warning",
              status.status === 'due-later' && "text-muted-foreground"
            )}>
              {status.message}
            </span>
          </div>
        );
      },
      meta: { label: 'Valid Until' }
    },
    {
      id: 'actions',
      cell: ({ row }) => <QuoteRowActions quote={row.original} />,
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
    loadQuotes();
  }, []);

  useEffect(() => {
    // Apply filters
    const filters: ColumnFiltersState = [];
    
    if (statusFilter !== 'all') {
      filters.push({ id: 'status', value: [statusFilter] });
    }
    
    if (searchFilter) {
      filters.push({ id: 'customer.name', value: searchFilter });
    }
    
    setColumnFilters(filters);
  }, [statusFilter, searchFilter]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const result = await billingRepository.listQuotes();
      setData(result.data);
    } catch (error) {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = () => {
    router.push('/dashboard/quotes/new');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading quotes...</p>
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
            <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Manage your sales quotes and convert them to invoices.
            </p>
          </div>
          <Button onClick={handleCreateQuote} className="w-full sm:w-auto">
            <IconPlus className="mr-2 h-4 w-4" />
            Create Quote
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.filter(q => q.status === QuoteStatus.DRAFT).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.filter(q => q.status === QuoteStatus.SENT).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.reduce((sum, quote) => sum + quote.totals.grandTotal, 0))}
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
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuoteStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-32">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={QuoteStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={QuoteStatus.SENT}>Sent</SelectItem>
                  <SelectItem value={QuoteStatus.EXPIRED}>Expired</SelectItem>
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
