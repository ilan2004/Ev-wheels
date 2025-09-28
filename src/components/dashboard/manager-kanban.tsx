'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DueDateModal } from './manager/modals/due-date-modal';

const COLUMNS = [
  { id: 'reported', title: 'Reported' },
  { id: 'triaged', title: 'Triaged' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' }
] as const;

type Ticket = {
  id: string;
  ticket_number: string;
  symptom: string;
  status: string;
  due_date?: string | null;
  priority?: number | null;
  pipeline_order?: number | null;
};

type Buckets = Record<string, Ticket[]>;

export function ManagerKanban() {
  const [buckets, setBuckets] = React.useState<Buckets>({
    reported: [],
    triaged: [],
    in_progress: [],
    completed: []
  });
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [dueModal, setDueModal] = React.useState<{
    open: boolean;
    ticketId?: string;
    due?: string | null;
  }>(() => ({ open: false }));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const statuses = COLUMNS.map((c) => c.id);
      const fetched: Buckets = {
        reported: [],
        triaged: [],
        in_progress: [],
        completed: []
      };
      for (const st of statuses) {
        let query = supabase
          .from('service_tickets')
          .select(
            'id, ticket_number, symptom, status, due_date, priority, pipeline_order'
          )
          .eq('status', st)
          .order('pipeline_order', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(30);
        if (search.trim()) {
          const like = `%${search.trim()}%`;
          query = query.or(
            `ticket_number.ilike.${like},symptom.ilike.${like}`
          ) as any;
        }
        const { data, error } = await query;
        if (error) throw error;
        fetched[st] = (data || []) as Ticket[];
      }
      setBuckets(fetched);
    } catch (e) {
      console.error('kanban load error', e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handlePriorityChange = async (ticketId: string, p: 1 | 2 | 3) => {
    try {
      // Optimistic UI update
      setBuckets((prev) => {
        const next: Buckets = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].map((t) =>
            t.id === ticketId ? { ...t, priority: p } : t
          );
        }
        return next;
      });
      const { error } = await supabase
        .from('service_tickets')
        .update({ priority: p })
        .eq('id', ticketId);
      if (error) throw error;
      toast.success('Priority updated');
    } catch (e: any) {
      console.error('update priority failed', e);
      toast.error('Failed to update priority', {
        description: e?.message || 'Please try again.'
      });
      load();
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine source and target columns
    const fromId =
      (active.data?.current as any)?.status ||
      (Object.keys(buckets).find((k) =>
        buckets[k].some((t) => t.id === activeId)
      ) as string | undefined);
    let toId = (over.data?.current as any)?.status as string | undefined;
    if (!toId) {
      // If over a ticket item, infer its column
      toId = Object.keys(buckets).find((k) =>
        buckets[k].some((t) => t.id === overId)
      ) as string | undefined;
    }
    if (!fromId || !toId) return;

    const current = buckets;
    const srcList = [...current[fromId]];
    const srcIdx = srcList.findIndex((t) => t.id === activeId);
    if (srcIdx === -1) return;

    const moving = { ...srcList[srcIdx], status: toId } as Ticket;
    srcList.splice(srcIdx, 1);

    const dstListPre = fromId === toId ? srcList : [...current[toId]];
    // Determine destination index: if dropped on column, place at index 0; else place at the index of the over ticket
    let dstIdx =
      overId === toId ? 0 : dstListPre.findIndex((t) => t.id === overId);
    if (dstIdx < 0) dstIdx = 0;

    let newDstList: Ticket[];
    if (fromId === toId) {
      // Reorder within same column
      newDstList = [...dstListPre];
      newDstList.splice(dstIdx, 0, moving);
    } else {
      // Move across columns
      newDstList = [...dstListPre];
      newDstList.splice(dstIdx, 0, moving);
    }

    // Compute new pipeline_order based on neighbors (descending order: larger = higher)
    const computeNewOrder = (list: Ticket[], index: number): number => {
      const before = list[index - 1]?.pipeline_order ?? null;
      const after = list[index + 1]?.pipeline_order ?? null;
      const here = list[index]?.pipeline_order ?? null;
      // If neighbors exist, pick midpoint; if top, increment above first; if bottom, decrement below last
      if (index === 0) {
        const first = list[1]?.pipeline_order;
        const base = Number.isFinite(first as any) ? (first as number) : 0;
        return Number.isFinite(here as any)
          ? Math.max(here as number, base + 1)
          : base + 1;
      }
      if (index === list.length - 1) {
        const last = list[index - 1]?.pipeline_order;
        const base = Number.isFinite(last as any) ? (last as number) : 0;
        return Number.isFinite(here as any)
          ? Math.min(here as number, base - 1)
          : base - 1;
      }
      const a = Number.isFinite(before as any) ? (before as number) : 0;
      const b = Number.isFinite(after as any) ? (after as number) : 0;
      // If a == b (rare), nudge by +/- 0.001
      if (a === b) return a + 0.001;
      return (a + b) / 2;
    };

    const newOrder = computeNewOrder(newDstList, dstIdx);
    newDstList[dstIdx] = { ...newDstList[dstIdx], pipeline_order: newOrder };

    // Build new buckets state
    const newBuckets: Buckets = {
      ...current,
      [fromId]: fromId === toId ? newDstList : srcList,
      [toId]: fromId === toId ? newDstList : newDstList
    } as Buckets;

    setBuckets(newBuckets);

    try {
      const payload: any =
        fromId === toId
          ? { pipeline_order: newOrder }
          : { status: toId, pipeline_order: newOrder };
      const { error } = await supabase
        .from('service_tickets')
        .update(payload)
        .eq('id', activeId);
      if (error) throw error;
      toast.success('Ticket updated');
    } catch (e: any) {
      console.error('update status/order failed', e);
      toast.error('Failed to update ticket', {
        description: e?.message || 'Please try again.'
      });
      load();
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Input
          placeholder='Search tickets (number or symptom)'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-md'
        />
        <Button variant='outline' onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              count={buckets[col.id].length}
            >
              <SortableContext
                items={buckets[col.id].map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className='min-h-[80px] space-y-2'>
                  {buckets[col.id].map((t) => (
                    <SortableTicket
                      key={t.id}
                      ticket={t}
                      status={col.id}
                      onDueDate={() =>
                        setDueModal({
                          open: true,
                          ticketId: t.id,
                          due: t.due_date || null
                        })
                      }
                      onPriorityChange={(p) => handlePriorityChange(t.id, p)}
                    />
                  ))}
                  {buckets[col.id].length === 0 && (
                    <li className='text-muted-foreground text-sm'>
                      No tickets
                    </li>
                  )}
                </ul>
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
      </DndContext>

      <DueDateModal
        open={dueModal.open}
        ticketId={dueModal.ticketId}
        initialDue={dueModal.due || undefined}
        onClose={() => setDueModal({ open: false })}
        onSaved={() => load()}
      />
    </div>
  );
}

function SortableTicket({
  ticket,
  status,
  onDueDate,
  onPriorityChange
}: {
  ticket: Ticket;
  status: string;
  onDueDate: () => void;
  onPriorityChange: (p: 1 | 2 | 3) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: ticket.id, data: { status } });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none'
  };
  const p = ticket.priority ?? 3;
  const label = p === 1 ? 'P1 High' : p === 2 ? 'P2 Med' : 'P3 Low';
  const colorClasses =
    p === 1
      ? 'bg-red-100 text-red-700 border-red-200'
      : p === 2
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <li
      ref={setNodeRef}
      style={style}
      className='bg-card rounded border p-2'
      {...attributes}
      {...listeners}
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='truncate text-sm font-medium'>
          {ticket.ticket_number} — {ticket.symptom}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${colorClasses}`}
          >
            {label}
          </span>
          <Select
            value={String(p)}
            onValueChange={(val) => onPriorityChange(Number(val) as 1 | 2 | 3)}
          >
            <SelectTrigger size='sm' className='h-7 px-2'>
              <SelectValue placeholder='Priority' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>P1 High</SelectItem>
              <SelectItem value='2'>P2 Med</SelectItem>
              <SelectItem value='3'>P3 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='text-muted-foreground mt-1 flex items-center gap-2 text-xs'>
        <span>
          Status:{' '}
          <span className='capitalize'>{ticket.status.replace('_', ' ')}</span>
        </span>
        {ticket.due_date && (
          <span>• Due: {new Date(ticket.due_date).toLocaleDateString()}</span>
        )}
      </div>
      <div className='mt-2 flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={(e) => {
            e.stopPropagation();
            onDueDate();
          }}
        >
          Due Date
        </Button>
        <Button variant='ghost' size='sm' asChild>
          <Link href={`/dashboard/tickets/${ticket.id}`}>Open</Link>
        </Button>
      </div>
    </li>
  );
}

function KanbanColumn({
  id,
  title,
  count,
  children
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { status: id } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border p-3 ${isOver ? 'bg-muted/50' : 'bg-background/50'}`}
    >
      <div className='mb-2 flex items-center justify-between'>
        <div className='font-semibold'>{title}</div>
        <Badge variant='outline'>{count}</Badge>
      </div>
      {children}
    </div>
  );
}
