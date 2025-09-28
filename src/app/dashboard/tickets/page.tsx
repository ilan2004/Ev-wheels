'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/layout/section-header';
import { serviceTicketsApi, type ServiceTicket } from '@/lib/api/service-tickets';
import type { Customer } from '@/types/bms';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill, PriorityPill, CombinedStatus, type TicketStatus } from '@/components/ui/status-pills';
import { MetricCard } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconTicket, IconAlertTriangle, IconClock, IconUsers, IconPlus, IconFilter, IconSearch, IconDots, IconEye, IconEdit, IconUserPlus, IconFileExport } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

export default function TicketsListPage() {
  const [tickets, setTickets] = useState<(ServiceTicket & { customer?: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  
  // KPI State
  const [kpis, setKpis] = useState({
    total: 0,
    open: 0,
    overdue: 0,
    dueToday: 0,
    highPriority: 0
  });

  // Calculate KPIs from tickets data
  const calculateKpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const openStatuses = ['reported', 'triaged', 'assigned', 'in_progress', 'waiting_approval'];
    
    const total = tickets.length;
    const open = tickets.filter(t => openStatuses.includes(t.status)).length;
    const overdue = tickets.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < today && openStatuses.includes(t.status);
    }).length;
    const dueToday = tickets.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }).length;
    const highPriority = tickets.filter(t => t.priority === 1).length;
    
    return { total, open, overdue, dueToday, highPriority };
  }, [tickets]);
  
  useEffect(() => {
    setKpis(calculateKpis);
  }, [calculateKpis]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const effectiveStatus = status === 'all' ? undefined : (status as any);
      // Note: Priority filtering would need API support
      const res = await serviceTicketsApi.listTickets({ search, status: effectiveStatus, limit: pageSize, offset });
      if (res.success && res.data) {
        const filteredData = priority === 'all' 
          ? res.data 
          : res.data.filter(t => String(t.priority) === priority);
        setTickets(filteredData);
      }
      setLoading(false);
    };
    load();
  }, [search, status, priority, page, pageSize]);

  useEffect(() => {
    // Reset to first page on filter changes
    setPage(1);
  }, [search, status, priority]);
  
  // Helper functions
  const toggleTicketSelection = (ticketId: string) => {
    const newSelection = new Set(selectedTickets);
    if (newSelection.has(ticketId)) {
      newSelection.delete(ticketId);
    } else {
      newSelection.add(ticketId);
    }
    setSelectedTickets(newSelection);
  };
  
  const selectAllTickets = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map(t => t.id)));
    }
  };
  
  const getStatusVariant = (status: TicketStatus) => {
    const urgentStatuses = ['reported', 'overdue'];
    return urgentStatuses.includes(status) ? 'danger' : 'default';
  };
  
  const getDueDateStatus = (dueDate?: string | null) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays) };
    if (diffDays === 0) return { status: 'due_today', days: 0 };
    if (diffDays <= 2) return { status: 'due_soon', days: diffDays };
    return { status: 'future', days: diffDays };
  };

  return (
    <TooltipProvider>
      <PageContainer>
        <div className="flex flex-col gap-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <SectionHeader 
              title="Service Tickets" 
              description={`${kpis.total} total tickets • ${kpis.open} open • ${kpis.overdue} overdue`} 
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <IconFilter className="h-4 w-4 mr-1" />
                Filters
                {showFilters && <Badge variant="secondary" className="ml-2">ON</Badge>}
              </Button>
              <Button size="sm">
                <IconPlus className="h-4 w-4 mr-1" />
                New Ticket
              </Button>
            </div>
          </div>

          {/* Advanced Search and Filters */}
          <Card>
            <CardContent className="py-6">
              {/* Main Search Bar */}
              <div className="relative mb-4">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by ticket number, customer, vehicle reg, or symptoms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              {/* Quick Filter Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  variant={status === 'all' ? 'secondary' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatus('all')}
                >
                  All
                </Button>
                <Button 
                  variant={status === 'reported' ? 'secondary' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatus('reported')}
                >
                  Reported
                </Button>
                <Button 
                  variant={status === 'in_progress' ? 'secondary' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatus('in_progress')}
                >
                  In Progress
                </Button>
                <Button 
                  variant={status === 'completed' ? 'secondary' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatus('completed')}
                >
                  Completed
                </Button>
                {kpis.overdue > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setSearch('overdue')}
                  >
                    <IconAlertTriangle className="h-4 w-4 mr-1" />
                    Overdue ({kpis.overdue})
                  </Button>
                )}
              </div>
              
              {/* Advanced Filters (Collapsible) */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {['reported','triaged','assigned','in_progress','completed','delivered','closed','cancelled','on_hold','waiting_approval'].map(s => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <StatusPill status={s as TicketStatus} variant="compact" />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="1">🔴 High Priority</SelectItem>
                      <SelectItem value="2">🟡 Medium Priority</SelectItem>
                      <SelectItem value="3">⚪ Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input placeholder="Customer name..." className="h-9" />
                  <Input placeholder="Vehicle reg..." className="h-9" />
                </div>
              )}
              
              {/* Batch Actions */}
              {selectedTickets.size > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-4">
                  <span className="text-sm font-medium">
                    {selectedTickets.size} ticket{selectedTickets.size > 1 ? 's' : ''} selected
                  </span>
                  <Button size="sm" variant="outline">
                    <IconUserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                  <Button size="sm" variant="outline">
                    <IconEdit className="h-4 w-4 mr-1" />
                    Status
                  </Button>
                  <Button size="sm" variant="outline">
                    <IconFileExport className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedTickets(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-12 px-3 py-2">
                        <Checkbox 
                          checked={selectedTickets.size === tickets.length && tickets.length > 0}
                          onCheckedChange={selectAllTickets}
                        />
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Ticket</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Customer</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Vehicle</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Status</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Priority</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Created</th>
                      <th scope="col" className="w-12 px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={`skeleton-${i}`} className="border-t">
                          <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-4 w-48" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-3 py-3"><Skeleton className="h-4 w-8" /></td>
                        </tr>
                      ))
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td className="px-3 py-8 text-center text-muted-foreground" colSpan={8}>
                          <div className="flex flex-col items-center gap-2">
                            <IconTicket className="h-8 w-8 text-muted-foreground/50" />
                            <div>No tickets found</div>
                            <div className="text-xs">Try adjusting your search or filters</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => {
                        const dueStatus = getDueDateStatus(ticket.due_date);
                        return (
                          <tr 
                            key={ticket.id} 
                            className="border-t hover:bg-muted/50 group transition-colors"
                          >
                            <td className="px-3 py-3">
                              <Checkbox 
                                checked={selectedTickets.has(ticket.id)}
                                onCheckedChange={() => toggleTicketSelection(ticket.id)}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                <Link 
                                  className="text-primary font-medium hover:underline" 
                                  href={`/dashboard/tickets/${ticket.id}`}
                                >
                                  {ticket.ticket_number}
                                </Link>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {ticket.symptom}
                                </div>
                                {dueStatus && (
                                  <div className={`text-xs flex items-center gap-1 ${
                                    dueStatus.status === 'overdue' ? 'text-red-600' :
                                    dueStatus.status === 'due_today' ? 'text-amber-600' :
                                    dueStatus.status === 'due_soon' ? 'text-blue-600' :
                                    'text-muted-foreground'
                                  }`}>
                                    <IconClock className="h-3 w-3" />
                                    {dueStatus.status === 'overdue' ? `${dueStatus.days}d overdue` :
                                     dueStatus.status === 'due_today' ? 'Due today' :
                                     dueStatus.status === 'due_soon' ? `Due in ${dueStatus.days}d` :
                                     `${dueStatus.days}d remaining`}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                <div className="font-medium">{ticket.customer?.name || '-'}</div>
                                {ticket.customer?.contact && (
                                  <div className="text-xs text-muted-foreground">
                                    {ticket.customer.contact}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                <div className="font-medium">{ticket.vehicle_reg_no || '-'}</div>
                                {ticket.vehicle_make && (
                                  <div className="text-xs text-muted-foreground">
                                    {ticket.vehicle_make} {ticket.vehicle_model}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <StatusPill status={ticket.status as TicketStatus} variant="compact" />
                            </td>
                            <td className="px-3 py-3">
                              {ticket.priority ? (
                                <PriorityPill priority={ticket.priority as 1 | 2 | 3} variant="compact" />
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <Tooltip>
                                <TooltipTrigger>
                                  <time className="text-sm" dateTime={ticket.created_at}>
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                  </time>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {new Date(ticket.created_at).toLocaleString()}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-3 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <IconDots className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                                      <IconEye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <IconUserPlus className="h-4 w-4 mr-2" />
                                    Assign Technician
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <IconEdit className="h-4 w-4 mr-2" />
                                    Change Status
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <IconFileExport className="h-4 w-4 mr-2" />
                                    Export Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={`mobile-skeleton-${i}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <IconTicket className="h-12 w-12 text-muted-foreground/50" />
                    <div className="text-muted-foreground">
                      <div className="font-medium">No tickets found</div>
                      <div className="text-sm">Try adjusting your search or filters</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => {
                const dueStatus = getDueDateStatus(ticket.due_date);
                return (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Checkbox 
                              checked={selectedTickets.has(ticket.id)}
                              onCheckedChange={() => toggleTicketSelection(ticket.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <Link 
                                className="text-primary font-semibold hover:underline block truncate" 
                                href={`/dashboard/tickets/${ticket.id}`}
                              >
                                {ticket.ticket_number}
                              </Link>
                              {dueStatus && (
                                <div className={`text-xs flex items-center gap-1 mt-1 ${
                                  dueStatus.status === 'overdue' ? 'text-red-600' :
                                  dueStatus.status === 'due_today' ? 'text-amber-600' :
                                  dueStatus.status === 'due_soon' ? 'text-blue-600' :
                                  'text-muted-foreground'
                                }`}>
                                  <IconClock className="h-3 w-3" />
                                  {dueStatus.status === 'overdue' ? `${dueStatus.days}d overdue` :
                                   dueStatus.status === 'due_today' ? 'Due today' :
                                   dueStatus.status === 'due_soon' ? `Due in ${dueStatus.days}d` :
                                   `${dueStatus.days}d remaining`}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill status={ticket.status as TicketStatus} variant="compact" />
                            {ticket.priority && (
                              <PriorityPill priority={ticket.priority as 1 | 2 | 3} variant="compact" />
                            )}
                          </div>
                        </div>
                        
                        {/* Symptom */}
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.symptom}
                        </div>
                        
                        {/* Customer & Vehicle Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                              Customer
                            </div>
                            <div className="font-medium">{ticket.customer?.name || '-'}</div>
                            {ticket.customer?.contact && (
                              <div className="text-xs text-muted-foreground">
                                {ticket.customer.contact}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                              Vehicle
                            </div>
                            <div className="font-medium">{ticket.vehicle_reg_no || '-'}</div>
                            {ticket.vehicle_make && (
                              <div className="text-xs text-muted-foreground">
                                {ticket.vehicle_make} {ticket.vehicle_model}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <time className="text-xs text-muted-foreground" dateTime={ticket.created_at}>
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </time>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <IconDots className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/tickets/${ticket.id}`}>
                                  <IconEye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconUserPlus className="h-4 w-4 mr-2" />
                                Assign Technician
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEdit className="h-4 w-4 mr-2" />
                                Change Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Enhanced Pagination */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {loading ? (
                    'Loading...'
                  ) : (
                    `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, kpis.total)} of ${kpis.total} tickets`
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n} per page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => p + 1)} 
                      disabled={loading || tickets.length < pageSize}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </TooltipProvider>
  );
}
