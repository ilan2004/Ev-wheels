'use client';

import React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DueDateModal } from './manager/modals/due-date-modal';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const STATUS_TABS = [
  { id: 'reported', label: 'Reported' },
  { id: 'triaged', label: 'Triaged' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
] as const;

type StatusId = (typeof STATUS_TABS)[number]['id'];

type Ticket = {
  id: string;
  ticket_number: string;
  symptom: string;
  status: StatusId;
  due_date: string | null;
  priority: number | null;
  created_at: string;
};

export interface QueuePreset {
  status?: StatusId;
  overdue?: boolean;
  dueToday?: boolean;
  priority?: 1 | 2 | 3;
  unassigned?: boolean;
}

export function ManagerQueue({ preset }: { preset?: QueuePreset }) {
  const [status, setStatus] = React.useState<StatusId>(
    preset?.status ?? 'reported'
  );
  const [search, setSearch] = React.useState('');
  const [priority, setPriority] = React.useState<1 | 2 | 3 | null>(
    preset?.priority ?? null
  );
  const [overdue, setOverdue] = React.useState<boolean>(
    preset?.overdue ?? false
  );
  const [dueToday, setDueToday] = React.useState<boolean>(
    preset?.dueToday ?? false
  );
  const [unassigned, setUnassigned] = React.useState<boolean>(
    preset?.unassigned ?? false
  );
  const [rows, setRows] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const [dueModal, setDueModal] = React.useState<{
    open: boolean;
    ticketId?: string;
    due?: string | null;
  }>({ open: false });

  React.useEffect(() => {
    // Clear selection when filters/status change
    setSelected(new Set());
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('service_tickets')
          .select(
            'id, ticket_number, symptom, status, due_date, priority, created_at'
          )
          .eq('status', status)
          .order('priority', { ascending: true })
          .order('due_date', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(100);

        if (search.trim()) {
          const like = `%${search.trim()}%`;
          query = query.or(
            `ticket_number.ilike.${like},symptom.ilike.${like}`
          ) as any;
        }
        if (priority) {
          query = query.eq('priority', priority) as any;
        }
        if (overdue || dueToday) {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(start.getDate() + 1);
          if (overdue) {
            query = query.lt('due_date', start.toISOString()) as any;
          }
          if (dueToday) {
            query = query
              .gte('due_date', start.toISOString())
              .lt('due_date', end.toISOString()) as any;
          }
        }
        if (unassigned) {
          query = query.is('assigned_to', null) as any;
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!isMounted) return;
        setRows((data || []) as Ticket[]);
      } catch (e) {
        console.error('queue load error', e);
        if (!isMounted) return;
        setRows([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [status, search, priority, overdue, dueToday, unassigned, tick]);

  const PriorityPill = ({ p }: { p: number | null }) => {
    const label = p === 1 ? 'P1' : p === 2 ? 'P2' : p === 3 ? 'P3' : '—';
    const classes =
      p === 1
        ? 'bg-red-100 text-red-700 border-red-200'
        : p === 2
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : p === 3
            ? 'bg-gray-100 text-gray-700 border-gray-200'
            : 'bg-muted text-muted-foreground border-transparent';
    return (
      <span
        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${classes}`}
      >
        {label}
      </span>
    );
  };

  const DueCell = ({ due }: { due: string | null }) => {
    if (!due) return <span className='text-muted-foreground'>—</span>;
    const d = new Date(due);
    const now = new Date();
    const isOverdue = d < now;
    const isToday = d.toDateString() === now.toDateString();
    const cls = isOverdue
      ? 'text-red-600'
      : isToday
        ? 'text-amber-600'
        : 'text-foreground';
    return <span className={cls}>{d.toLocaleDateString()}</span>;
  };

  const ageDays = (created: string) => {
    const d = new Date(created);
    const now = new Date();
    const diff = Math.max(0, now.getTime() - d.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const refresh = () => setTick((t) => t + 1);

  const bulkUpdate = async (
    payload: Record<string, any>,
    successMsg: string
  ) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      const { error } = (await supabase
        .from('service_tickets')
        .update(payload)
        .in('id', ids as any)
        .select('id')) as any;
      if (error) throw error;
      toast.success(successMsg, {
        description: `${ids.length} ticket(s) updated`
      });
      setSelected(new Set());
      refresh();
    } catch (e: any) {
      toast.error('Bulk update failed', {
        description: e?.message || 'Please try again.'
      });
    }
  };

  const setDueTodayBulk = () => {
    const start = new Date();
    start.setHours(23, 59, 0, 0);
    bulkUpdate({ due_date: start.toISOString() }, 'Due date set to today');
  };
  const clearDueBulk = () => bulkUpdate({ due_date: null }, 'Due date cleared');
  const setPriorityBulk = (p: 1 | 2 | 3) =>
    bulkUpdate({ priority: p }, `Priority set to P${p}`);
  const setStatusBulk = (s: StatusId) =>
    bulkUpdate({ status: s }, `Status set to ${s.replace('_', ' ')}`);

  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  };

  return (
    <div className='space-y-3'>
      {/* Filters */}
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Search ticket # or symptom'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-xs'
        />
        <div className='flex items-center gap-1'>
          <Button
            variant={priority === 1 ? 'default' : 'outline'}
            size='sm'
            onClick={() => setPriority(priority === 1 ? null : 1)}
          >
            P1
          </Button>
          <Button
            variant={priority === 2 ? 'default' : 'outline'}
            size='sm'
            onClick={() => setPriority(priority === 2 ? null : 2)}
          >
            P2
          </Button>
          <Button
            variant={priority === 3 ? 'default' : 'outline'}
            size='sm'
            onClick={() => setPriority(priority === 3 ? null : 3)}
          >
            P3
          </Button>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant={overdue ? 'default' : 'outline'}
            size='sm'
            onClick={() => setOverdue((v) => !v)}
          >
            Overdue
          </Button>
          <Button
            variant={dueToday ? 'default' : 'outline'}
            size='sm'
            onClick={() => setDueToday((v) => !v)}
          >
            Due Today
          </Button>
          <Button
            variant={unassigned ? 'default' : 'outline'}
            size='sm'
            onClick={() => setUnassigned((v) => !v)}
          >
            Unassigned
          </Button>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setSearch('');
            setPriority(null);
            setOverdue(false);
            setDueToday(false);
            setUnassigned(false);
          }}
        >
          Reset
        </Button>
      </div>

      {/* Bulk actions toolbar */}
      {selected.size > 0 && (
        <div className='bg-card/60 flex flex-wrap items-center gap-2 rounded-lg border p-2'>
          <div className='text-sm font-medium'>Selected {selected.size}</div>
          <div className='bg-border h-4 w-px' />
          <div className='flex items-center gap-1'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setPriorityBulk(1)}
            >
              Set P1
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setPriorityBulk(2)}
            >
              Set P2
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setPriorityBulk(3)}
            >
              Set P3
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusBulk('reported')}>
                Reported
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusBulk('triaged')}>
                Triaged
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusBulk('in_progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusBulk('completed')}>
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                Due Date
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuItem onClick={setDueTodayBulk}>
                Set to Today
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearDueBulk}>
                Clear Due Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className='ml-auto'>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setSelected(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Status Tabs + Table */}
      <Tabs value={status} onValueChange={(val) => setStatus(val as StatusId)}>
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUS_TABS.map((s) => (
          <TabsContent key={s.id} value={s.id}>
            <div className='rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-8'>
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={toggleSelectAll as any}
                        aria-label='Select all'
                      />
                    </TableHead>
                    <TableHead className='w-40'>Ticket</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className='w-16'>Pri</TableHead>
                    <TableHead className='w-28'>Due</TableHead>
                    <TableHead className='w-16'>Age</TableHead>
                    <TableHead className='w-44'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className='text-muted-foreground'>
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className='text-muted-foreground'>
                        No tickets
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    rows.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(t.id)}
                            onCheckedChange={(checked) => {
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(t.id);
                                else next.delete(t.id);
                                return next;
                              });
                            }}
                            aria-label={`Select ticket ${t.ticket_number}`}
                          />
                        </TableCell>
                        <TableCell className='font-medium'>
                          {t.ticket_number}
                        </TableCell>
                        <TableCell className='text-muted-foreground max-w-[420px] truncate'>
                          {t.symptom}
                        </TableCell>
                        <TableCell>
                          <PriorityPill p={t.priority ?? null} />
                        </TableCell>
                        <TableCell>
                          <DueCell due={t.due_date} />
                        </TableCell>
                        <TableCell>{ageDays(t.created_at)}d</TableCell>
                        <TableCell>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                setDueModal({
                                  open: true,
                                  ticketId: t.id,
                                  due: t.due_date
                                })
                              }
                            >
                              Due
                            </Button>
                            <Button size='sm' variant='ghost' asChild>
                              <Link href={`/dashboard/tickets/${t.id}`}>
                                Open
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <DueDateModal
        open={dueModal.open}
        ticketId={dueModal.ticketId}
        initialDue={dueModal.due || undefined}
        onClose={() => setDueModal({ open: false })}
        onSaved={() => {
          refresh();
        }}
      />
    </div>
  );
}
