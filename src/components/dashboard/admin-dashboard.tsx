'use client';

import React from 'react';
// Removed User import - using SerializedUser interface
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconBattery,
  IconUsers,
  IconPackage,
  IconReceipt,
  IconTrendingUp,
  IconSettings,
  IconShield,
  IconAlertTriangle,
  IconPlus,
  IconCalendar,
  IconClock,
  IconClipboardList,
  IconRefresh,
  IconWifi
} from '@tabler/icons-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import PageContainer from '@/components/layout/page-container';
import {
  MetricCard,
  StatusCard,
  EnhancedCard
} from '@/components/ui/enhanced-card';
import { formatDashboardDate, getLayoutClasses } from '@/lib/dashboard-utils';
import { useDashboard } from '@/hooks/use-dashboard-data';
import { useRealtimeSync } from '@/hooks/use-realtime';
import { useMasterPrefetch } from '@/hooks/use-prefetch';
import {
  QueryStateWrapper,
  DashboardKpiSkeleton,
  ChartSkeleton,
  RefreshIndicator,
  StaleDataIndicator
} from '@/components/ui/query-states';
import type { OptimizedKpis, WeeklyDeliveryPoint } from '@/lib/api/cache-layer';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

// Serialized user data for client components
interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  imageUrl: string;
  publicMetadata: Record<string, any>;
}

interface AdminDashboardProps {
  user: SerializedUser;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Administrator';
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Use the new React Query dashboard hook
  const dashboard = useDashboard();

  // Set up real-time synchronization
  const realtimeSync = useRealtimeSync({
    batteries: true,
    customers: true,
    serviceTickets: true,
    backgroundSync: true,
    visibilitySync: true
  });

  // Set up intelligent prefetching
  const prefetch = useMasterPrefetch({
    hover: true,
    route: true,
    intelligent: true,
    idle: true
  });

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageContainer>
      <motion.div
        className={getLayoutClasses('content')}
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Enhanced Welcome Header */}
        <motion.div
          className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}
          variants={itemVariants}
        >
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <h1 className='from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight'>
                Welcome back, {userName}!
              </h1>
              <div className='hidden sm:block'>
                <Badge variant='secondary' className='px-3 py-1 font-medium'>
                  Administrator
                </Badge>
              </div>
            </div>
            <p className='text-muted-foreground text-lg'>
              Here&apos;s what&apos;s happening at E-Wheels today.
            </p>
          </div>
          <div
            className={`flex items-center gap-4 ${isMobile ? 'justify-between' : ''}`}
          >
            {isMobile && (
              <Badge variant='secondary' className='px-3 py-1 font-medium'>
                Administrator
              </Badge>
            )}
            <div className='text-right'>
              <div className='text-foreground text-sm font-medium'>
                {formatDashboardDate(new Date(), 'long')}
              </div>
              <div className='text-muted-foreground text-xs'>
                Last login: 2 hours ago
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Key Metrics with React Query */}
        <motion.div variants={itemVariants}>
          <QueryStateWrapper
            query={{
              data: dashboard.kpis,
              isLoading: dashboard.isLoading,
              isError: dashboard.isError,
              error: dashboard.error,
              refetch: dashboard.refetch
            }}
            loadingSkeleton={<DashboardKpiSkeleton />}
            errorTitle='Failed to load dashboard metrics'
          >
            {(kpis) => (
              <div className='space-y-4'>
                {/* Stale data indicator */}
                <StaleDataIndicator
                  isStale={dashboard.isStale}
                  lastUpdated={dashboard.dataUpdatedAt}
                />

                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <MetricCard
                    title='Total Batteries'
                    value={kpis.totalBatteries}
                    change={{
                      value: `${kpis.pendingRepairs} pending`,
                      trend: 'neutral'
                    }}
                    icon={<IconBattery className='h-5 w-5' />}
                    variant='elevated'
                    accent='batteries'
                    actionable
                    onClick={() => {
                      prefetch.prefetchForRouteChange('/dashboard/batteries');
                      window.location.href = '/dashboard/batteries';
                    }}
                  />

                  <MetricCard
                    title='Active Customers'
                    value={kpis.activeCustomers}
                    change={{
                      value: 'this month',
                      trend: 'neutral'
                    }}
                    icon={<IconUsers className='h-5 w-5' />}
                    variant='elevated'
                    accent='customers'
                    actionable
                    onClick={() => {
                      prefetch.prefetchForRouteChange('/dashboard/customers');
                      window.location.href = '/dashboard/customers';
                    }}
                  />

                  <MetricCard
                    title='Completed This Month'
                    value={kpis.completedThisMonth}
                    change={{
                      value: 'batteries delivered',
                      trend: 'up'
                    }}
                    icon={<IconTrendingUp className='h-5 w-5' />}
                    variant='elevated'
                    accent='revenue'
                    actionable
                    onClick={() =>
                      (window.location.href =
                        '/dashboard/batteries?delivered=month')
                    }
                  />

                  <MetricCard
                    title='Pending Repairs'
                    value={kpis.pendingRepairs}
                    change={{
                      value: 'awaiting action',
                      trend: 'neutral'
                    }}
                    icon={<IconClock className='h-5 w-5' />}
                    variant='elevated'
                    accent='repairs'
                    actionable
                    onClick={() =>
                      (window.location.href = '/dashboard/batteries/status')
                    }
                  />
                </div>
              </div>
            )}
          </QueryStateWrapper>
        </motion.div>

        {/* Enhanced Quick Actions & System Alerts */}
        <motion.div
          className='grid gap-6 md:grid-cols-2'
          variants={itemVariants}
        >
          <EnhancedCard variant='elevated' animated>
            <div className='p-6'>
              <div className='mb-4 flex items-center gap-2'>
                <IconPlus className='text-primary h-5 w-5' />
                <h3 className='text-lg font-semibold'>Quick Actions</h3>
              </div>
              <p className='text-muted-foreground mb-6 text-sm'>
                Frequently used admin functions
              </p>
              <div className='grid gap-3'>
                <Button
                  asChild
                  variant='default'
                  className='h-11 justify-start'
                >
                  <Link href='/dashboard/job-cards/new'>
                    <IconClipboardList className='mr-3 h-4 w-4' />
                    New Job Card
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-11 justify-start'
                >
                  <Link href='/dashboard/batteries/new'>
                    <IconBattery className='mr-3 h-4 w-4' />
                    Add Battery Record
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-11 justify-start'
                >
                  <Link href='/dashboard/customers/new'>
                    <IconUsers className='mr-3 h-4 w-4' />
                    Add Customer
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-11 justify-start'
                >
                  <Link href='/dashboard/users/new'>
                    <IconShield className='mr-3 h-4 w-4' />
                    Add User
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-11 justify-start'
                >
                  <Link href='/dashboard/invoices/quote/new'>
                    <IconReceipt className='mr-3 h-4 w-4' />
                    Generate Quote
                  </Link>
                </Button>
              </div>
            </div>
          </EnhancedCard>

          <div className='space-y-4'>
            <div className='mb-4 flex items-center gap-2'>
              <IconAlertTriangle className='h-5 w-5 text-orange-500' />
              <h3 className='text-lg font-semibold'>System Alerts</h3>
            </div>
            <div className='space-y-3'>
              <StatusCard
                title='Low Stock Alert'
                description='5 items below minimum threshold'
                status='warning'
                icon={<IconPackage className='h-4 w-4' />}
                action={{
                  label: 'View Inventory',
                  onClick: () =>
                    (window.location.href = '/dashboard/inventory/alerts')
                }}
                dismissible
              />

              <StatusCard
                title='Overdue Repairs'
                description='3 batteries past promised delivery'
                status='danger'
                icon={<IconClock className='h-4 w-4' />}
                action={{
                  label: 'Check Status',
                  onClick: () =>
                    (window.location.href = '/dashboard/batteries/status')
                }}
                dismissible
              />

              <StatusCard
                title='New User Request'
                description='2 pending role assignments'
                status='info'
                icon={<IconUsers className='h-4 w-4' />}
                action={{
                  label: 'Manage Users',
                  onClick: () =>
                    (window.location.href = '/dashboard/users/roles')
                }}
                dismissible
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Management Sections */}
        <motion.div
          className='grid gap-6 md:grid-cols-3'
          variants={itemVariants}
        >
          <EnhancedCard variant='success' hoverable animated>
            <div className='p-6 text-center'>
              <div className='mb-4 flex justify-center'>
                <div className='rounded-full bg-green-100 p-3 dark:bg-green-900/30'>
                  <IconBattery className='h-6 w-6 text-green-600' />
                </div>
              </div>
              <h3 className='mb-2 text-lg font-semibold'>Battery Management</h3>
              <p className='text-muted-foreground mb-4 text-sm'>
                Manage battery records, repairs, and status tracking
              </p>
              <Button asChild size='sm' className='w-full'>
                <Link href='/dashboard/batteries'>View All Batteries</Link>
              </Button>
            </div>
          </EnhancedCard>

          <EnhancedCard variant='info' hoverable animated>
            <div className='p-6 text-center'>
              <div className='mb-4 flex justify-center'>
                <div className='rounded-full bg-blue-100 p-3 dark:bg-blue-900/30'>
                  <IconTrendingUp className='h-6 w-6 text-blue-600' />
                </div>
              </div>
              <h3 className='mb-2 text-lg font-semibold'>
                Reports & Analytics
              </h3>
              <p className='text-muted-foreground mb-4 text-sm'>
                Financial reports, performance metrics, and insights
              </p>
              <Button asChild size='sm' variant='outline' className='w-full'>
                <Link href='/dashboard/reports'>View Reports</Link>
              </Button>
            </div>
          </EnhancedCard>

          <EnhancedCard variant='default' hoverable animated>
            <div className='p-6 text-center'>
              <div className='mb-4 flex justify-center'>
                <div className='rounded-full bg-gray-100 p-3 dark:bg-gray-800'>
                  <IconSettings className='h-6 w-6 text-gray-600' />
                </div>
              </div>
              <h3 className='mb-2 text-lg font-semibold'>System Settings</h3>
              <p className='text-muted-foreground mb-4 text-sm'>
                User management, system configuration, and logs
              </p>
              <Button asChild size='sm' variant='outline' className='w-full'>
                <Link href='/dashboard/settings'>Manage Settings</Link>
              </Button>
            </div>
          </EnhancedCard>
        </motion.div>

        {/* Weekly Deliveries Trend with React Query */}
        <motion.div variants={itemVariants}>
          <QueryStateWrapper
            query={{
              data: dashboard.trends,
              isLoading: dashboard.isLoading,
              isError: dashboard.isError,
              error: dashboard.error,
              refetch: dashboard.refetch
            }}
            loadingSkeleton={<ChartSkeleton height={300} />}
            errorTitle='Failed to load delivery trends'
            emptyState={{
              icon: <IconTrendingUp className='h-12 w-12' />,
              title: 'No delivery data available',
              description:
                'Delivery trends will appear here once you have completed battery deliveries.'
            }}
          >
            {(trends) => (
              <EnhancedCard variant='elevated' animated>
                <div className='p-6'>
                  <div className='mb-6 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <IconCalendar className='text-primary h-5 w-5' />
                      <h3 className='text-lg font-semibold'>
                        Weekly Deliveries
                      </h3>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => dashboard.refresh.refreshTrends()}
                      disabled={dashboard.isFetching}
                    >
                      <IconRefresh
                        className={`h-4 w-4 ${dashboard.isFetching ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  </div>
                  <ChartContainer
                    config={{
                      deliveries: {
                        label: 'Deliveries',
                        color: 'hsl(var(--chart-1))'
                      }
                    }}
                  >
                    <AreaChart
                      data={trends.map((p: any) => ({
                        week: p.weekStart.slice(5),
                        deliveries: p.count
                      }))}
                      margin={{ left: 12, right: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey='week'
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey='deliveries'
                        type='natural'
                        fill='var(--color-deliveries)'
                        stroke='var(--color-deliveries)'
                        fillOpacity={0.4}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </EnhancedCard>
            )}
          </QueryStateWrapper>
        </motion.div>

        {/* Enhanced Recent Activity */}
        <motion.div variants={itemVariants}>
          <EnhancedCard variant='elevated' animated>
            <div className='p-6'>
              <div className='mb-6 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <IconCalendar className='text-primary h-5 w-5' />
                  <h3 className='text-lg font-semibold'>Recent Activity</h3>
                </div>
                <Button variant='ghost' size='sm' asChild>
                  <Link href='/dashboard/activity'>View All</Link>
                </Button>
              </div>

              <div className='space-y-4'>
                <motion.div
                  className='flex items-center gap-4 rounded-lg border border-green-200 bg-green-50/50 p-3 transition-colors duration-200 hover:bg-green-50/70 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-950/30'
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/50'>
                    <IconBattery className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>
                      New battery record created
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      72V 39Ah battery for customer Basheer •{' '}
                      {formatDashboardDate(
                        new Date(Date.now() - 2 * 60 * 60 * 1000)
                      )}
                    </div>
                  </div>
                  <Badge variant='outline' className='text-xs'>
                    New
                  </Badge>
                </motion.div>

                <motion.div
                  className='flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3 transition-colors duration-200 hover:bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-950/30'
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900/50'>
                    <IconUsers className='h-4 w-4 text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>
                      New customer registered
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Anand (9846161043) •{' '}
                      {formatDashboardDate(
                        new Date(Date.now() - 4 * 60 * 60 * 1000)
                      )}
                    </div>
                  </div>
                  <Badge variant='secondary' className='text-xs'>
                    Customer
                  </Badge>
                </motion.div>

                <motion.div
                  className='flex items-center gap-4 rounded-lg border border-purple-200 bg-purple-50/50 p-3 transition-colors duration-200 hover:bg-purple-50/70 dark:border-purple-800 dark:bg-purple-950/20 dark:hover:bg-purple-950/30'
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900/50'>
                    <IconReceipt className='h-4 w-4 text-purple-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>Invoice generated</div>
                    <div className='text-muted-foreground text-xs'>
                      ₹4,500 for battery replacement •{' '}
                      {formatDashboardDate(
                        new Date(Date.now() - 6 * 60 * 60 * 1000)
                      )}
                    </div>
                  </div>
                  <Badge variant='outline' className='text-xs text-green-600'>
                    ₹4,500
                  </Badge>
                </motion.div>
              </div>
            </div>
          </EnhancedCard>
        </motion.div>

        {/* Global UI indicators */}
        <RefreshIndicator isFetching={dashboard.isFetching} />

        {/* Real-time connection status */}
        {!realtimeSync.isConnected && (
          <div className='fixed right-4 bottom-4 z-50'>
            <div className='flex items-center space-x-2 rounded-md border border-amber-200 bg-amber-100 px-3 py-2 text-amber-800 shadow-lg dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
              <IconWifi className='h-4 w-4' />
              <span className='text-sm'>Reconnecting...</span>
            </div>
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
}
