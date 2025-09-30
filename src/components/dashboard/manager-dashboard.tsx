'use client';

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  IconClipboardList,
  IconBattery,
  IconUsers,
  IconTrendingUp,
  IconAlertTriangle,
  IconListDetails
} from '@tabler/icons-react';
import { useLocationContext } from '@/lib/location/context';
import { supabase } from '@/lib/supabase/client';
import { fetchWeeklyDeliveredBatteries } from '@/lib/api/kpis';
import { ManagerKanban } from './manager-kanban';
import { ManagerQueue, type QueuePreset } from './manager-queue';
import {
  MetricCard,
  ProgressCard,
  StatusCard
} from '@/components/ui/enhanced-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedHeader } from './manager/enhanced-header';
import { EssentialKPIs } from './manager/essential-kpis';
import { AlertCenter } from './manager/alert-center';

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
    avgTatDays: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [emergencyMode, setEmergencyMode] = React.useState(false);
  const [ticketsByStatus, setTicketsByStatus] = React.useState<
    Record<string, any[]>
  >({});
  const [teamWorkload, setTeamWorkload] = React.useState<
    { assignee: string | null; count: number }[]
  >([]);
  const [sales, setSales] = React.useState<{
    quotesPending: any[];
    invoicesDue: any[];
  }>({ quotesPending: [], invoicesDue: [] });
  const [unassignedCount, setUnassignedCount] = React.useState<number>(0);
  const [slaRiskCount, setSlaRiskCount] = React.useState<number>(0);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Tickets (location-scoped via RLS): counts for open statuses
        const openStatuses = ['reported', 'triaged', 'assigned', 'in_progress'];
        const { count: openCount, error: openErr } = await supabase
          .from('service_tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', openStatuses);
        if (openErr) throw openErr;

        // Batteries in progress (diagnosed/in_progress)
        const { count: progCount, error: progErr } = await supabase
          .from('battery_records')
          .select('id', { count: 'exact', head: true })
          .in('status', ['diagnosed', 'in_progress']);
        if (progErr) throw progErr;

        // Due Today / Overdue using due_date
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const [
          { count: dueTodayCount, error: dueErr },
          { count: overdueCount, error: ovErr }
        ] = await Promise.all([
          supabase
            .from('service_tickets')
            .select('id', { count: 'exact', head: true })
            .gte('due_date', start.toISOString())
            .lt('due_date', end.toISOString()),
          supabase
            .from('service_tickets')
            .select('id', { count: 'exact', head: true })
            .lt('due_date', start.toISOString())
            .not('status', 'in', '(completed,delivered,closed)')
        ] as any);
        if (dueErr) throw dueErr;
        if (ovErr) throw ovErr;
        const dueToday = dueTodayCount || 0;
        const overdue = overdueCount || 0;

        // Weekly completed delivered batteries
        const trend = await fetchWeeklyDeliveredBatteries(1);
        const weeklyCompleted =
          trend.success && trend.data
            ? trend.data.reduce((s, p) => s + p.count, 0)
            : 0;

        // Avg TAT (fallback 0 for MVP; can be computed on server with SQL later)
        const avgTatDays = 0;

        setKpis({
          openTickets: openCount || 0,
          inProgressBatteries: progCount || 0,
          dueToday,
          overdue,
          weeklyCompleted,
          avgTatDays
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
        const statuses = ['reported', 'assigned', 'in_progress', 'completed'];
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
        const workload = Object.entries(grouped).map(([assignee, count]) => ({
          assignee: assignee === 'unassigned' ? null : assignee,
          count
        }));
        setTeamWorkload(workload);

        // Sales snapshot
        const [{ data: quotes }, { data: invoices }] = await Promise.all([
          supabase
            .from('quotes')
            .select('id, number, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('invoices')
            .select('id, number, balance_due, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);
        setSales({
          quotesPending: quotes || [],
          invoicesDue: (invoices || []).filter(
            (inv: any) => (inv.balance_due || 0) > 0
          )
        });
      } catch (e) {
        // fail silently in MVP; sections will show zero-state
        console.error('manager-dashboard load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Manager';

  // View switcher: Queue only (no Kanban for simplicity)
  const [queuePreset, setQueuePreset] = React.useState<QueuePreset | undefined>(
    undefined
  );

  // Handle metric clicks to filter the queue
  const handleMetricClick = (
    metric: 'overdue' | 'dueToday' | 'openTickets' | 'weeklyCompleted'
  ) => {
    switch (metric) {
      case 'overdue':
        setQueuePreset({ overdue: true });
        break;
      case 'dueToday':
        setQueuePreset({ dueToday: true });
        break;
      case 'openTickets':
        setQueuePreset(undefined); // Show all open tickets
        break;
      default:
        break;
    }
  };

  // Handle alert clicks to filter the queue
  const handleAlertClick = (filter: string) => {
    switch (filter) {
      case 'overdue':
        setQueuePreset({ overdue: true });
        break;
      case 'due-today':
        setQueuePreset({ dueToday: true });
        break;
      case 'unassigned':
        setQueuePreset({ unassigned: true });
        break;
      case 'all-critical':
        setQueuePreset({ overdue: true, dueToday: true });
        break;
      default:
        break;
    }
  };

  const handleEmergencyToggle = () => {
    setEmergencyMode(!emergencyMode);
    if (!emergencyMode) {
      // Enter emergency mode - focus on critical items only
      setQueuePreset({ overdue: true, priority: 1 });
    } else {
      // Exit emergency mode - clear filters
      setQueuePreset(undefined);
    }
  };

  return (
    <PageContainer>
      {/* Enhanced Header */}
      <EnhancedHeader
        user={user}
        urgentAlerts={kpis.overdue + (kpis.dueToday > 5 ? 1 : 0)}
        todaysSummary={{
          dueToday: kpis.dueToday,
          overdue: kpis.overdue,
          completed: kpis.weeklyCompleted
        }}
        onEmergencyToggle={handleEmergencyToggle}
        emergencyMode={emergencyMode}
      />

      {/* Essential KPIs */}
      <EssentialKPIs
        data={{
          overdue: kpis.overdue,
          dueToday: kpis.dueToday,
          openTickets: kpis.openTickets,
          weeklyCompleted: kpis.weeklyCompleted
        }}
        onMetricClick={handleMetricClick}
        loading={loading}
      />

      {/* Alert Center */}
      <AlertCenter
        data={{
          overdue: kpis.overdue,
          dueToday: kpis.dueToday,
          unassigned: unassignedCount
        }}
        onFilterClick={handleAlertClick}
        loading={loading}
      />

      {/* Job Cards Queue */}
      <Section
        title='Job Card Queue'
        description={
          emergencyMode
            ? 'Emergency mode: Showing only critical job cards'
            : 'Manage job cards efficiently with filters and bulk actions'
        }
      >
        <ManagerQueue preset={queuePreset} />
      </Section>

      {/* Team workload - Only show if not in emergency mode */}
      {!emergencyMode && (
        <Section
          title='Team Workload'
          description='Open job cards per technician (capacity 8)'
        >
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {teamWorkload.map((w) =>
              w.assignee ? (
                <ProgressCard
                  key={w.assignee}
                  title={w.assignee}
                  progress={Math.min(w.count, 8)}
                  total={8}
                />
              ) : (
                <StatusCard
                  key='unassigned'
                  title='Unassigned'
                  description={`${w.count} tickets waiting assignment`}
                  status='info'
                />
              )
            )}
            {teamWorkload.length === 0 && (
              <div className='text-muted-foreground text-sm'>
                No open assignments
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Sales - Only show if not in emergency mode */}
      {!emergencyMode && (
        <>
          {/* Sales snapshot */}
          <Section
            title='Sales Snapshot'
            description='Quotes pending and invoices due'
          >
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-lg border p-4'>
                <div className='mb-2 font-semibold'>Recent Quotes</div>
                <ul className='space-y-2'>
                  {sales.quotesPending.map((q: any) => (
                    <li key={q.id} className='flex justify-between text-sm'>
                      <span>
                        {q.number} — {q.status}
                      </span>
                      <Link
                        className='text-primary'
                        href={`/dashboard/quotes/${q.id}`}
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                  {sales.quotesPending.length === 0 && (
                    <div className='text-muted-foreground text-sm'>
                      No recent quotes
                    </div>
                  )}
                </ul>
              </div>
              <div className='rounded-lg border p-4'>
                <div className='mb-2 font-semibold'>Invoices With Balance</div>
                <ul className='space-y-2'>
                  {sales.invoicesDue.map((inv: any) => (
                    <li key={inv.id} className='flex justify-between text-sm'>
                      <span>
                        {inv.number} — ₹{inv.balance_due || 0}
                      </span>
                      <Link
                        className='text-primary'
                        href={`/dashboard/invoices/${inv.id}`}
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                  {sales.invoicesDue.length === 0 && (
                    <div className='text-muted-foreground text-sm'>
                      No outstanding invoices
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </Section>
        </>
      )}
    </PageContainer>
  );
}

function KpiCard({
  title,
  value,
  icon
}: {
  title: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
        {icon}
        <span>{title}</span>
      </div>
      <div className='text-2xl font-semibold'>{value}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='mb-6'>
      <div className='mb-2'>
        <div className='font-semibold'>{title}</div>
        {description && (
          <div className='text-muted-foreground text-sm'>{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}
