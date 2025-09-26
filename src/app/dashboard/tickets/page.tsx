'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/layout/section-header';
import { serviceTicketsApi, type ServiceTicket } from '@/lib/api/service-tickets';
import type { Customer } from '@/types/bms';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/layout/page-container';

export default function TicketsListPage() {
  const [tickets, setTickets] = useState<(ServiceTicket & { customer?: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const res = await serviceTicketsApi.listTickets({ search, status: status as any, limit: pageSize, offset });
      if (res.success && res.data) setTickets(res.data);
      setLoading(false);
    };
    load();
  }, [search, status, page, pageSize]);

  useEffect(() => {
    // Reset to first page on filter changes
    setPage(1);
  }, [search, status]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <SectionHeader title="Service Tickets" description="View and filter service tickets." />

        <Card>
          <CardContent className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by ticket number, reg no"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {['reported','triaged','assigned','in_progress','completed','delivered','closed','cancelled','on_hold','waiting_approval'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto rounded-md border" role="region" aria-label="Tickets table">
          <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Ticket</th>
              <th scope="col" className="px-3 py-2 text-left">Customer</th>
              <th scope="col" className="px-3 py-2 text-left">Vehicle</th>
              <th scope="col" className="px-3 py-2 text-left">Status</th>
              <th scope="col" className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`s-${i}`} className="border-t">
                  <td className="px-3 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-32" /></td>
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td className="px-3 py-6" colSpan={5}>No tickets found.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link className="text-primary underline" href={`/dashboard/tickets/${t.id}`}>{t.ticket_number}</Link>
                    <div className="text-muted-foreground mt-0.5">{t.symptom}</div>
                  </td>
                  <td className="px-3 py-2">{t.customer?.name || '-'}</td>
                  <td className="px-3 py-2">{t.vehicle_reg_no || '-'}</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{t.status}</Badge></td>
                  <td className="px-3 py-2">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Page {page}</div>
          <div className="flex items-center gap-2">
            <Button aria-label="Previous page" variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>Prev</Button>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v))}>
              <SelectTrigger className="w-[110px]" aria-label="Rows per page">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {[10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
              </SelectContent>
            </Select>
            <Button aria-label="Next page" variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={loading || tickets.length < pageSize}>Next</Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
