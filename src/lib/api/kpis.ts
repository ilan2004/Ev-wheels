import { supabase } from '@/lib/supabase/client';

export interface Kpis {
  totalBatteries: number;
  pendingRepairs: number;
  completedThisMonth: number;
  activeCustomers: number;
  ticketStatus: Record<string, number>;
}

export interface WeeklyPoint {
  weekStart: string; // ISO date (monday)
  count: number;
}

export interface KpiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function startOfMonthISO(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.toISOString();
}

function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function fetchKpis(): Promise<KpiResponse<Kpis>> {
  try {
    const monthStart = startOfMonthISO();

    const locId = (
      await import('@/lib/location/session')
    ).getActiveLocationId();

    const bCountQ = supabase
      .from('battery_records')
      .select('id', { count: 'exact', head: true });
    const pendingQ = supabase
      .from('battery_records')
      .select('id', { count: 'exact', head: true })
      .in('status', ['received', 'diagnosed', 'in_progress']);
    const completedMonthQ = supabase
      .from('battery_records')
      .select('id', { count: 'exact', head: true })
      .gte('delivered_date', monthStart)
      .in('status', ['completed', 'delivered']);
    const customersQ = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });
    const ticketsQ = supabase.from('service_tickets').select('status');

    const scoped = (table: string, q: any) =>
      locId ? q.eq('location_id', locId) : q;

    const [bCount, pending, completedMonth, customers, tickets] =
      await Promise.all([
        scoped('battery_records', bCountQ),
        scoped('battery_records', pendingQ),
        scoped('battery_records', completedMonthQ),
        scoped('customers', customersQ),
        scoped('service_tickets', ticketsQ)
      ]);

    if (bCount.error) throw bCount.error;
    if (pending.error) throw pending.error;
    if (completedMonth.error) throw completedMonth.error;
    if (customers.error) throw customers.error;
    if (tickets.error) throw tickets.error;

    const statusCounts: Record<string, number> = {};
    (tickets.data || []).forEach((t: any) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    return {
      success: true,
      data: {
        totalBatteries: bCount.count || 0,
        pendingRepairs: pending.count || 0,
        completedThisMonth: completedMonth.count || 0,
        activeCustomers: customers.count || 0,
        ticketStatus: statusCounts
      }
    };
  } catch (e) {
    console.error('fetchKpis error:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to fetch KPIs'
    };
  }
}

export async function fetchWeeklyDeliveredBatteries(
  weeks = 8
): Promise<KpiResponse<WeeklyPoint[]>> {
  try {
    const end = startOfWeek(new Date());
    const start = new Date(end);
    start.setDate(end.getDate() - weeks * 7);

    const locId = (
      await import('@/lib/location/session')
    ).getActiveLocationId();
    let q = supabase
      .from('battery_records')
      .select('delivered_date')
      .gte('delivered_date', start.toISOString());
    if (locId) q = q.eq('location_id', locId);
    const { data, error } = await q;

    if (error) throw error;

    const buckets: Record<string, number> = {};
    // Create week buckets
    for (let i = 0; i < weeks; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i * 7);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }

    (data || []).forEach((row: any) => {
      if (!row.delivered_date) return;
      const d = startOfWeek(new Date(row.delivered_date));
      const key = d.toISOString().slice(0, 10);
      if (buckets[key] === undefined) buckets[key] = 0;
      buckets[key]++;
    });

    const points = Object.keys(buckets)
      .sort()
      .map((k) => ({ weekStart: k, count: buckets[k] }));

    return { success: true, data: points };
  } catch (e) {
    console.error('fetchWeeklyDeliveredBatteries error:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to fetch weekly trend'
    };
  }
}
