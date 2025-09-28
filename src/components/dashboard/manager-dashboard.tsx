"use client";

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { IconClipboardList, IconBattery, IconUsers, IconArrowsExchange, IconTrendingUp, IconAlertTriangle, IconListDetails } from '@tabler/icons-react';
import { useLocationContext } from '@/lib/location/context';
import { supabase } from '@/lib/supabase/client';
import { fetchWeeklyDeliveredBatteries } from '@/lib/api/kpis';
import { ManagerKanban } from './manager-kanban';
import { ManagerQueue, type QueuePreset } from './manager-queue';
import { MetricCard, ProgressCard, StatusCard } from '@/components/ui/enhanced-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  imageUrl: string;
  publicMetadata: Record<string, any>;
}

export function ManagerDashboard({ user }: { user: SerializedUser }) {
  const { activeLocationName } = useLocationContext();
  const [kpis, setKpis] = React.useState({
    openTickets: 0,
    inProgressBatteries: 0,
    dueToday: 0,
    overdue: 0,
    weeklyCompleted: 0,
    avgTatDays: 0,
  });
  const [ticketsByStatus, setTicketsByStatus] = React.useState<Record<string, any[]>>({});
  const [teamWorkload, setTeamWorkload] = React.useState<{ assignee: string | null; count: number }[]>([]);
  const [movements, setMovements] = React.useState<any[]>([]);
  const [sales, setSales] = React.useState<{ quotesPending: any[]; invoicesDue: any[] }>({ quotesPending: [], invoicesDue: [] });
  const [unassignedCount, setUnassignedCount] = React.useState<number>(0);
  const [slaRiskCount, setSlaRiskCount] = React.useState<number>(0);

  React.useEffect(() => {
    (async () => {
      try {
        // Tickets (location-scoped via RLS): counts for open statuses
        const openStatuses = ['reported','triaged','assigned','in_progress'];
        const { count: openCount, error: openErr } = await supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', openStatuses);
        if (openErr) throw openErr;

        // Batteries in progress (diagnosed/in_progress)
        const { count: progCount, error: progErr } = await supabase
          .from('battery_records')
          .select('id', { count: 'exact', head: true })
          .in('status', ['diagnosed','in_progress']);
        if (progErr) throw progErr;

        // Due Today / Overdue using due_date
        const start = new Date();
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const [{ count: dueTodayCount, error: dueErr }, { count: overdueCount, error: ovErr }] = await Promise.all([
          supabase.from('service_tickets').select('id', { count: 'exact', head: true }).gte('due_date', start.toISOString()).lt('due_date', end.toISOString()),
          supabase.from('service_tickets').select('id', { count: 'exact', head: true }).lt('due_date', start.toISOString()).not('status', 'in', '(completed,delivered,closed)')
        ] as any);
        if (dueErr) throw dueErr;
        if (ovErr) throw ovErr;
        const dueToday = dueTodayCount || 0;
        const overdue = overdueCount || 0;

        // Weekly completed delivered batteries
        const trend = await fetchWeeklyDeliveredBatteries(1);
        const weeklyCompleted = trend.success && trend.data ? trend.data.reduce((s, p) => s + p.count, 0) : 0;

        // Avg TAT (fallback 0 for MVP; can be computed on server with SQL later)
        const avgTatDays = 0;

        setKpis({
          openTickets: openCount || 0,
          inProgressBatteries: progCount || 0,
          dueToday,
          overdue,
          weeklyCompleted,
          avgTatDays,
        });

        // Unassigned count (open statuses with no assignee)
        const { count: unassigned, error: unErr } = await supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', openStatuses)
          .is('assigned_to', null);
        if (unErr) throw unErr;
        setUnassignedCount(unassigned || 0);

        // SLA risk: due in next 24h and not completed
        const next24h = new Date();
        next24h.setHours(next24h.getHours() + 24);
        const { count: slaRisk, error: slaErr } = await supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .gte('due_date', new Date().toISOString())
          .lt('due_date', next24h.toISOString())
          .not('status', 'in', '(completed,delivered,closed)');
        if (slaErr) throw slaErr;
        setSlaRiskCount(slaRisk || 0);

        // Tickets by status (sample lists)
        const statuses = ['reported','assigned','in_progress','completed'];
        const buckets: Record<string, any[]> = {};
        for (const st of statuses) {
          const { data } = await supabase
            .from('service_tickets')
            .select('id, ticket_number, symptom, status, created_at')
            .eq('status', st)
            .order('created_at', { ascending: false })
            .limit(5);
          buckets[st] = data || [];
        }
        setTicketsByStatus(buckets);

        // Team workload (group by assigned_to)
        const { data: teamData } = await supabase
          .from('service_tickets')
          .select('assigned_to')
          .in('status', openStatuses);
        const grouped: Record<string, number> = {};
        (teamData || []).forEach((r: any) => {
          const key = r.assigned_to || 'unassigned';
          grouped[key] = (grouped[key] || 0) + 1;
        });
        const workload = Object.entries(grouped).map(([assignee, count]) => ({ assignee: assignee === 'unassigned' ? null : assignee, count }));
        setTeamWorkload(workload);

        // Inventory movements (recent)
        const { data: mv } = await supabase
          .from('inventory_movements')
          .select('id, movement_type, from_location_id, to_location_id, quantity, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        setMovements(mv || []);

        // Sales snapshot
        const [{ data: quotes }, { data: invoices }] = await Promise.all([
          supabase.from('quotes').select('id, number, status, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('invoices').select('id, number, balance_due, created_at').order('created_at', { ascending: false }).limit(5),
        ]);
        setSales({ quotesPending: quotes || [], invoicesDue: (invoices || []).filter((inv: any) => (inv.balance_due || 0) > 0) });
      } catch (e) {
        // fail silently in MVP; sections will show zero-state
        console.error('manager-dashboard load error', e);
      }
    })();
  }, []);

  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Manager';

  // View switcher: Queue (default) | Kanban
  const [view, setView] = React.useState<'queue' | 'kanban'>(() => {
    if (typeof window === 'undefined') return 'queue';
    return (localStorage.getItem('manager_view_mode') as 'queue' | 'kanban') || 'queue';
  });
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('manager_view_mode', view);
    }
  }, [view]);

  const [queuePreset, setQueuePreset] = React.useState<QueuePreset | undefined>(undefined);

  return (
    <PageContainer>
      {/* Header with quick actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hello, {userName}</h1>
            <Badge variant="secondary">Manager</Badge>
            {activeLocationName && (
              <Badge variant="outline">{activeLocationName}</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Here’s your location overview and quick actions.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button asChild><Link href="/dashboard/tickets/new"><IconClipboardList className="h-4 w-4 mr-2" /> New Ticket</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/quotes/new"><IconListDetails className="h-4 w-4 mr-2" /> New Quote</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/customers/new"><IconUsers className="h-4 w-4 mr-2" /> Add Customer</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/inventory/movements"><IconArrowsExchange className="h-4 w-4 mr-2" /> Request Movement</Link></Button>
        </div>
      </div>

      {/* KPIs (using MetricCard with accents) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <MetricCard title="Open Tickets" value={kpis.openTickets} icon={<IconClipboardList className="h-4 w-4" />} accent="repairs" actionable onClick={() => { /* future: filter to open */ }} />
        <MetricCard title="In-Progress Batteries" value={kpis.inProgressBatteries} icon={<IconBattery className="h-4 w-4" />} accent="batteries" />
        <MetricCard title="Due Today" value={kpis.dueToday} icon={<IconClipboardList className="h-4 w-4" />} accent="repairs" />
        <MetricCard title="Overdue" value={kpis.overdue} icon={<IconAlertTriangle className="h-4 w-4" />} accent="repairs" />
        <MetricCard title="Weekly Completed" value={kpis.weeklyCompleted} icon={<IconTrendingUp className="h-4 w-4" />} accent="revenue" />
      </div>

      {/* Attention Required */}
      <Section title="Attention Required" description="Key issues needing action">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard title="Overdue Tickets" description="Tickets past due and still open" status="danger" animated icon={<IconAlertTriangle className="h-5 w-5" />} action={{ label: `${kpis.overdue} overdue`, onClick: () => { setQueuePreset({ overdue: true }); setView('queue'); } }} />
          <StatusCard title="Due Today" description="Tickets due today" status="warning" animated icon={<IconClipboardList className="h-5 w-5" />} action={{ label: `${kpis.dueToday} due`, onClick: () => { setQueuePreset({ dueToday: true }); setView('queue'); } }} />
          <StatusCard title="Unassigned" description="Tickets not yet assigned" status="info" animated icon={<IconUsers className="h-5 w-5" />} action={{ label: `${unassignedCount} unassigned`, onClick: () => { setQueuePreset({ unassigned: true }); setView('queue'); } }} />
          <StatusCard title="SLA Risk (24h)" description="Due within 24h" status="warning" animated icon={<IconTrendingUp className="h-5 w-5 rotate-90" />} action={{ label: `${slaRiskCount} at risk`, onClick: () => { setQueuePreset({ dueToday: true }); setView('queue'); } }} />
        </div>
      </Section>

      {/* Tickets: View switcher */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-semibold">Tickets</div>
          <div className="text-sm text-muted-foreground">Work your queue quickly or switch to Kanban for pipeline view.</div>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as 'queue' | 'kanban')}>
          <TabsList>
            <TabsTrigger value="queue">Simple Queue</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === 'queue' ? (
        <ManagerQueue preset={queuePreset} />
      ) : (
        <Section title="Ticket Pipeline" description="Drag between columns to update status; assign technicians and set due dates">
          <ManagerKanban />
        </Section>
      )}

      {/* Team workload */}
      <Section title="Team Workload" description="Open tickets per technician (capacity 8)">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {teamWorkload.map((w) => (
            w.assignee ? (
              <ProgressCard key={w.assignee} title={w.assignee} progress={Math.min(w.count, 8)} total={8} />
            ) : (
              <StatusCard key="unassigned" title="Unassigned" description={`${w.count} tickets waiting assignment`} status="info" />
            )
          ))}
          {teamWorkload.length === 0 && (
            <div className="text-sm text-muted-foreground">No open assignments</div>
          )}
        </div>
      </Section>

      {/* Inventory movements */}
      <Section title="Inventory Movements" description="Recent requests and approvals">
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Qty</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 capitalize">{m.movement_type}</td>
                  <td className="p-2">{m.quantity}</td>
                  <td className="p-2 capitalize">{m.status}</td>
                  <td className="p-2">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td className="p-2 text-muted-foreground" colSpan={4}>No recent movements</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Sales snapshot */}
      <Section title="Sales Snapshot" description="Quotes pending and invoices due">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-2">Recent Quotes</div>
            <ul className="space-y-2">
              {sales.quotesPending.map((q: any) => (
                <li key={q.id} className="text-sm flex justify-between">
                  <span>{q.number} — {q.status}</span>
                  <Link className="text-primary" href={`/dashboard/quotes/${q.id}`}>Open</Link>
                </li>
              ))}
              {sales.quotesPending.length === 0 && (
                <div className="text-sm text-muted-foreground">No recent quotes</div>
              )}
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-2">Invoices With Balance</div>
            <ul className="space-y-2">
              {sales.invoicesDue.map((inv: any) => (
                <li key={inv.id} className="text-sm flex justify-between">
                  <span>{inv.number} — ₹{inv.balance_due || 0}</span>
                  <Link className="text-primary" href={`/dashboard/invoices/${inv.id}`}>Open</Link>
                </li>
              ))}
              {sales.invoicesDue.length === 0 && (
                <div className="text-sm text-muted-foreground">No outstanding invoices</div>
              )}
            </ul>
          </div>
        </div>
      </Section>
    </PageContainer>
  );
}

function KpiCard({ title, value, icon }: { title: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2">
        <div className="font-semibold">{title}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {children}
    </div>
  );
}

