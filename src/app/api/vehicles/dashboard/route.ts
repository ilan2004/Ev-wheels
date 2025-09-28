import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Dashboard metrics response types
export interface DashboardMetrics {
  totalVehicles: {
    current: number;
    trend: 'up' | 'down' | 'neutral';
    change: number;
  };
  averageTurnaroundTime: {
    current: number; // in days
    trend: 'up' | 'down' | 'neutral';
    change: number;
  };
  todaysArrivals: {
    current: number;
    trend: 'up' | 'down' | 'neutral';
    change: number;
  };
  readyForPickup: {
    current: number;
    trend: 'up' | 'down' | 'neutral';
    change: number;
  };
  overdueCases: {
    current: number;
    trend: 'up' | 'down' | 'neutral';
    change: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  technicianUtilization: {
    current: number; // percentage
    trend: 'up' | 'down' | 'neutral';
    change: number;
  };
}

export interface AnalyticsData {
  statusDistribution: {
    status: string;
    count: number;
    color: string;
  }[];
  intakeTrends: {
    date: string;
    count: number;
  }[];
  technicianWorkload: {
    technician: string;
    active: number;
    completed: number;
  }[];
  serviceTimeAnalysis: {
    status: string;
    averageHours: number;
  }[];
}

// GET /api/vehicles/dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const compareWith = searchParams.get('compare') || '30'; // days to compare with

    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));
    
    const compareEndDate = new Date(startDate);
    const compareStartDate = new Date(startDate);
    compareStartDate.setDate(compareEndDate.getDate() - parseInt(compareWith));

    // Get current period metrics
    const currentMetrics = await fetchMetrics(startDate, endDate);
    const compareMetrics = await fetchMetrics(compareStartDate, compareEndDate);
    
    // Get analytics data
    const analytics = await fetchAnalyticsData(startDate, endDate);

    // Calculate trends
    const metrics: DashboardMetrics = {
      totalVehicles: {
        current: currentMetrics.totalVehicles,
        trend: getTrend(currentMetrics.totalVehicles, compareMetrics.totalVehicles),
        change: getPercentageChange(currentMetrics.totalVehicles, compareMetrics.totalVehicles)
      },
      averageTurnaroundTime: {
        current: currentMetrics.avgTurnaround,
        trend: getTrend(compareMetrics.avgTurnaround, currentMetrics.avgTurnaround), // Lower is better
        change: getPercentageChange(currentMetrics.avgTurnaround, compareMetrics.avgTurnaround)
      },
      todaysArrivals: {
        current: currentMetrics.todaysArrivals,
        trend: getTrend(currentMetrics.todaysArrivals, compareMetrics.todaysArrivals),
        change: getPercentageChange(currentMetrics.todaysArrivals, compareMetrics.todaysArrivals)
      },
      readyForPickup: {
        current: currentMetrics.readyForPickup,
        trend: getTrend(currentMetrics.readyForPickup, compareMetrics.readyForPickup),
        change: getPercentageChange(currentMetrics.readyForPickup, compareMetrics.readyForPickup)
      },
      overdueCases: {
        current: currentMetrics.overdueCases,
        trend: getTrend(compareMetrics.overdueCases, currentMetrics.overdueCases), // Lower is better
        change: getPercentageChange(currentMetrics.overdueCases, compareMetrics.overdueCases),
        severity: getOverdueSeverity(currentMetrics.overdueCases, currentMetrics.totalVehicles)
      },
      technicianUtilization: {
        current: currentMetrics.technicianUtilization,
        trend: getTrend(currentMetrics.technicianUtilization, compareMetrics.technicianUtilization),
        change: getPercentageChange(currentMetrics.technicianUtilization, compareMetrics.technicianUtilization)
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard metrics' 
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch metrics for a date range
async function fetchMetrics(startDate: Date, endDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Total vehicles in service (excluding delivered/cancelled)
  const { count: totalVehicles } = await supabase
    .from('vehicle_cases')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("delivered", "cancelled")')
    .gte('received_date', startDate.toISOString())
    .lte('received_date', endDate.toISOString());

  // Average turnaround time for completed cases
  const { data: completedCases } = await supabase
    .from('vehicle_cases')
    .select('received_date, delivered_date')
    .eq('status', 'delivered')
    .not('delivered_date', 'is', null)
    .gte('received_date', startDate.toISOString())
    .lte('received_date', endDate.toISOString());

  const avgTurnaround = completedCases && completedCases.length > 0
    ? completedCases.reduce((sum, case_) => {
        const received = new Date(case_.received_date);
        const delivered = new Date(case_.delivered_date);
        const diffDays = Math.ceil((delivered.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / completedCases.length
    : 0;

  // Today's arrivals
  const { count: todaysArrivals } = await supabase
    .from('vehicle_cases')
    .select('*', { count: 'exact', head: true })
    .gte('received_date', today.toISOString())
    .lt('received_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

  // Ready for pickup
  const { count: readyForPickup } = await supabase
    .from('vehicle_cases')
    .select('*', { count: 'exact', head: true })
    .in('status', ['completed', 'ready_for_pickup']);

  // Overdue cases (more than 7 days old and not completed)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: overdueCases } = await supabase
    .from('vehicle_cases')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("delivered", "cancelled", "completed")')
    .lt('received_date', sevenDaysAgo.toISOString());

  // Technician utilization (active cases per technician)
  const { data: technicianCases } = await supabase
    .from('vehicle_cases')
    .select('assigned_technician')
    .not('status', 'in', '("delivered", "cancelled")')
    .not('assigned_technician', 'is', null);

  const activeTechnicians = new Set(technicianCases?.map(c => c.assigned_technician) || []).size;
  const avgCasesPerTechnician = activeTechnicians > 0 ? (technicianCases?.length || 0) / activeTechnicians : 0;
  const technicianUtilization = Math.min(avgCasesPerTechnician * 20, 100); // Assuming 5 cases = 100% utilization

  return {
    totalVehicles: totalVehicles || 0,
    avgTurnaround,
    todaysArrivals: todaysArrivals || 0,
    readyForPickup: readyForPickup || 0,
    overdueCases: overdueCases || 0,
    technicianUtilization
  };
}

// Helper function to fetch analytics data
async function fetchAnalyticsData(startDate: Date, endDate: Date): Promise<AnalyticsData> {
  // Status distribution
  const { data: statusData } = await supabase
    .from('vehicle_cases')
    .select('status')
    .gte('received_date', startDate.toISOString())
    .lte('received_date', endDate.toISOString());

  const statusCounts: { [key: string]: number } = {};
  statusData?.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });

  const statusColors: { [key: string]: string } = {
    'received': '#3b82f6',
    'diagnosed': '#f59e0b', 
    'in_progress': '#8b5cf6',
    'completed': '#10b981',
    'ready_for_pickup': '#06b6d4',
    'delivered': '#22c55e',
    'on_hold': '#ef4444',
    'cancelled': '#6b7280'
  };

  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace('_', ' ').toUpperCase(),
    count,
    color: statusColors[status] || '#6b7280'
  }));

  // Intake trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: intakeData } = await supabase
    .from('vehicle_cases')
    .select('received_date')
    .gte('received_date', thirtyDaysAgo.toISOString())
    .order('received_date');

  const dailyCounts: { [key: string]: number } = {};
  intakeData?.forEach(item => {
    const date = new Date(item.received_date).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  const intakeTrends = Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count
  }));

  // Technician workload
  const { data: workloadData } = await supabase
    .from('vehicle_cases')
    .select('assigned_technician, status')
    .not('assigned_technician', 'is', null)
    .gte('received_date', startDate.toISOString())
    .lte('received_date', endDate.toISOString());

  const technicianStats: { [key: string]: { active: number; completed: number; } } = {};
  workloadData?.forEach(item => {
    const tech = item.assigned_technician;
    if (!technicianStats[tech]) {
      technicianStats[tech] = { active: 0, completed: 0 };
    }
    if (item.status === 'delivered') {
      technicianStats[tech].completed++;
    } else {
      technicianStats[tech].active++;
    }
  });

  const technicianWorkload = Object.entries(technicianStats).map(([technician, stats]) => ({
    technician: technician || 'Unassigned',
    active: stats.active,
    completed: stats.completed
  }));

  // Service time analysis
  const { data: serviceTimeData } = await supabase
    .from('vehicle_cases')
    .select('status, received_date, updated_at')
    .gte('received_date', startDate.toISOString())
    .lte('received_date', endDate.toISOString());

  const statusTimes: { [key: string]: number[] } = {};
  serviceTimeData?.forEach(item => {
    const received = new Date(item.received_date);
    const updated = new Date(item.updated_at);
    const diffHours = Math.ceil((updated.getTime() - received.getTime()) / (1000 * 60 * 60));
    
    if (!statusTimes[item.status]) {
      statusTimes[item.status] = [];
    }
    statusTimes[item.status].push(diffHours);
  });

  const serviceTimeAnalysis = Object.entries(statusTimes).map(([status, times]) => ({
    status: status.replace('_', ' ').toUpperCase(),
    averageHours: times.reduce((sum, time) => sum + time, 0) / times.length
  }));

  return {
    statusDistribution,
    intakeTrends,
    technicianWorkload,
    serviceTimeAnalysis
  };
}

// Helper functions
function getTrend(current: number, previous: number): 'up' | 'down' | 'neutral' {
  if (Math.abs(current - previous) < 0.01) return 'neutral';
  return current > previous ? 'up' : 'down';
}

function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function getOverdueSeverity(overdue: number, total: number): 'low' | 'medium' | 'high' | 'critical' {
  const percentage = total > 0 ? (overdue / total) * 100 : 0;
  if (percentage >= 30) return 'critical';
  if (percentage >= 20) return 'high';
  if (percentage >= 10) return 'medium';
  return 'low';
}
