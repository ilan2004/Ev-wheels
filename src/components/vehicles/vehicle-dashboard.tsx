'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  MetricCard,
  StatusCard,
  EnhancedCard
} from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import {
  IconCar,
  IconClock,
  IconCalendar,
  IconChecks,
  IconAlertTriangle,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconFilter,
  IconDownload,
  IconEye
} from '@tabler/icons-react';
import { formatDashboardDate } from '@/lib/dashboard-utils';

// Types from our API endpoint
export interface DashboardMetrics {
  totalVehicles: {
    current: number;
    trend: 'up' | 'down' | 'neutral';
    change: number;
  };
  averageTurnaroundTime: {
    current: number;
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
    current: number;
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

interface VehicleDashboardProps {
  onFilterSelect?: (filters: any) => void;
  className?: string;
}

export function VehicleDashboard({
  onFilterSelect,
  className
}: VehicleDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');

  // Fetch dashboard data
  const fetchDashboardData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/vehicles/dashboard?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to load data');

      setMetrics(data.data.metrics);
      setAnalytics(data.data.analytics);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Get trend icon and color
  const getTrendDisplay = (
    trend: 'up' | 'down' | 'neutral',
    change: number
  ) => {
    const icon =
      trend === 'up'
        ? IconTrendingUp
        : trend === 'down'
          ? IconTrendingDown
          : null;
    const color =
      trend === 'up'
        ? 'text-green-600'
        : trend === 'down'
          ? 'text-red-600'
          : 'text-muted-foreground';
    return { icon, color, text: `${change >= 0 ? '+' : ''}${change}%` };
  };

  // Get severity color for overdue cases
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  if (error) {
    return (
      <div className='p-6 text-center'>
        <IconAlertTriangle className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
        <h3 className='mb-2 text-lg font-semibold'>Unable to load dashboard</h3>
        <p className='text-muted-foreground mb-4'>{error}</p>
        <Button onClick={() => fetchDashboardData()}>
          <IconRefresh className='mr-2 h-4 w-4' />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with controls */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Vehicle Analytics
          </h2>
          <p className='text-muted-foreground'>
            Insights and metrics for vehicle service operations
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value='7'>7 Days</TabsTrigger>
              <TabsTrigger value='30'>30 Days</TabsTrigger>
              <TabsTrigger value='90'>90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            <IconRefresh
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        <MetricCard
          title='Total Vehicles'
          value={metrics?.totalVehicles.current || 0}
          change={
            metrics
              ? {
                  value: getTrendDisplay(
                    metrics.totalVehicles.trend,
                    metrics.totalVehicles.change
                  ).text,
                  trend: metrics.totalVehicles.trend
                }
              : undefined
          }
          icon={<IconCar className='h-5 w-5' />}
          loading={loading}
          variant='elevated'
          actionable
          onClick={() => onFilterSelect?.({})}
        />

        <MetricCard
          title='Avg Turnaround'
          value={
            metrics
              ? `${metrics.averageTurnaroundTime.current.toFixed(1)} days`
              : '0 days'
          }
          change={
            metrics
              ? {
                  value: getTrendDisplay(
                    metrics.averageTurnaroundTime.trend,
                    metrics.averageTurnaroundTime.change
                  ).text,
                  trend: metrics.averageTurnaroundTime.trend
                }
              : undefined
          }
          icon={<IconClock className='h-5 w-5' />}
          loading={loading}
          variant='elevated'
        />

        <MetricCard
          title="Today's Arrivals"
          value={metrics?.todaysArrivals.current || 0}
          change={
            metrics
              ? {
                  value: getTrendDisplay(
                    metrics.todaysArrivals.trend,
                    metrics.todaysArrivals.change
                  ).text,
                  trend: metrics.todaysArrivals.trend
                }
              : undefined
          }
          icon={<IconCalendar className='h-5 w-5' />}
          loading={loading}
          variant='elevated'
          actionable
          onClick={() =>
            onFilterSelect?.({
              dateFrom: new Date().toISOString().split('T')[0]
            })
          }
        />

        <MetricCard
          title='Ready for Pickup'
          value={metrics?.readyForPickup.current || 0}
          change={
            metrics
              ? {
                  value: getTrendDisplay(
                    metrics.readyForPickup.trend,
                    metrics.readyForPickup.change
                  ).text,
                  trend: metrics.readyForPickup.trend
                }
              : undefined
          }
          icon={<IconChecks className='h-5 w-5' />}
          loading={loading}
          variant='elevated'
          actionable
          onClick={() =>
            onFilterSelect?.({ status: ['completed', 'ready_for_pickup'] })
          }
        />

        <MetricCard
          title='Overdue Cases'
          value={metrics?.overdueCases.current || 0}
          change={
            metrics
              ? {
                  value: `${metrics.overdueCases.severity.toUpperCase()} severity`,
                  trend: metrics.overdueCases.trend
                }
              : undefined
          }
          icon={<IconAlertTriangle className='h-5 w-5' />}
          loading={loading}
          variant={
            metrics?.overdueCases.severity === 'critical'
              ? 'danger'
              : 'elevated'
          }
          actionable
          onClick={() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            onFilterSelect?.({
              dateTo: sevenDaysAgo.toISOString().split('T')[0]
            });
          }}
        />

        <MetricCard
          title='Technician Util.'
          value={
            metrics
              ? `${metrics.technicianUtilization.current.toFixed(0)}%`
              : '0%'
          }
          change={
            metrics
              ? {
                  value: getTrendDisplay(
                    metrics.technicianUtilization.trend,
                    metrics.technicianUtilization.change
                  ).text,
                  trend: metrics.technicianUtilization.trend
                }
              : undefined
          }
          icon={<IconUsers className='h-5 w-5' />}
          loading={loading}
          variant='elevated'
        />
      </div>

      {/* Analytics Charts */}
      <div className='mb-6 grid gap-6 md:grid-cols-2'>
        {/* Status Distribution */}
        <EnhancedCard variant='elevated' animated>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <div className='bg-primary h-2 w-2 rounded-full' />
              Status Distribution
            </CardTitle>
            <CardDescription>
              Current breakdown of vehicle statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex h-64 items-center justify-center'>
                <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              </div>
            ) : analytics?.statusDistribution ? (
              <ChartContainer config={{}} className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='count'
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className='text-muted-foreground flex h-64 items-center justify-center'>
                No data available
              </div>
            )}
          </CardContent>
        </EnhancedCard>

        {/* Intake Trends */}
        <EnhancedCard variant='elevated' animated>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <div className='h-2 w-2 rounded-full bg-blue-500' />
              Intake Trends (30 Days)
            </CardTitle>
            <CardDescription>Daily vehicle arrivals over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex h-64 items-center justify-center'>
                <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              </div>
            ) : analytics?.intakeTrends ? (
              <ChartContainer
                config={{ count: { label: 'Arrivals', color: '#3b82f6' } }}
                className='h-64'
              >
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={analytics.intakeTrends}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickFormatter={(date) =>
                        new Date(date).getDate().toString()
                      }
                    />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(date) =>
                        formatDashboardDate(date, 'short')
                      }
                    />
                    <Line
                      type='monotone'
                      dataKey='count'
                      stroke='#3b82f6'
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className='text-muted-foreground flex h-64 items-center justify-center'>
                No data available
              </div>
            )}
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Technician Workload and Service Time Analysis */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Technician Workload */}
        <EnhancedCard variant='elevated' animated>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <div className='h-2 w-2 rounded-full bg-green-500' />
              Technician Workload
            </CardTitle>
            <CardDescription>
              Active vs completed cases by technician
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex h-64 items-center justify-center'>
                <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              </div>
            ) : analytics?.technicianWorkload ? (
              <ChartContainer
                config={{
                  active: { label: 'Active', color: '#f59e0b' },
                  completed: { label: 'Completed', color: '#10b981' }
                }}
                className='h-64'
              >
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={analytics.technicianWorkload}
                    layout='horizontal'
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis dataKey='technician' type='category' width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey='active' stackId='a' fill='#f59e0b' />
                    <Bar dataKey='completed' stackId='a' fill='#10b981' />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className='text-muted-foreground flex h-64 items-center justify-center'>
                No data available
              </div>
            )}
          </CardContent>
        </EnhancedCard>

        {/* Service Time Analysis */}
        <EnhancedCard variant='elevated' animated>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <div className='h-2 w-2 rounded-full bg-purple-500' />
              Service Time Analysis
            </CardTitle>
            <CardDescription>
              Average hours spent in each status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex h-64 items-center justify-center'>
                <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              </div>
            ) : analytics?.serviceTimeAnalysis ? (
              <div className='space-y-4'>
                {analytics.serviceTimeAnalysis.map((item, index) => (
                  <div
                    key={index}
                    className='bg-muted/50 flex items-center justify-between rounded-lg p-3'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='h-2 w-2 rounded-full bg-purple-500' />
                      <span className='font-medium'>{item.status}</span>
                    </div>
                    <div className='text-right'>
                      <span className='font-semibold'>
                        {item.averageHours.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-muted-foreground flex h-64 items-center justify-center'>
                No data available
              </div>
            )}
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  );
}
