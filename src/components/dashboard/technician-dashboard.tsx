'use client';

import React from 'react';
// Removed User import - using SerializedUser interface
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconBattery,
  IconUsers,
  IconClipboardList,
  IconPrinter,
  IconTool,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconCalendar,
  IconPlus
} from '@tabler/icons-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import PageContainer from '@/components/layout/page-container';
import {
  MetricCard,
  StatusCard,
  ProgressCard,
  EnhancedCard
} from '@/components/ui/enhanced-card';
import { formatDashboardDate, getLayoutClasses } from '@/lib/dashboard-utils';
import { NotificationsBell } from '@/components/dashboard/technician/notifications-bell';
import { InboxList } from '@/components/dashboard/technician/inbox-list';
import { MyWorkList } from '@/components/dashboard/technician/my-work-list';
import { TicketDetailsDrawer } from '@/components/dashboard/technician/ticket-details-drawer';
import { useRealtimeSync } from '@/hooks/use-realtime';

// Serialized user data for client components
interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  imageUrl: string;
  publicMetadata: Record<string, any>;
}

interface TechnicianDashboardProps {
  user: SerializedUser;
}

export function TechnicianDashboard({ user }: TechnicianDashboardProps) {
  const emailName = user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || null;
  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (emailName || 'Technician');
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Realtime and selection state for drawer
  const { status } = useRealtimeSync({ serviceTickets: true, batteries: false, customers: false });
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const openDrawer = (id: string) => {
    setSelectedTicketId(id);
    setDrawerOpen(true);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
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
          className="space-y-4 mb-6"
          variants={itemVariants}
        >
          {/* Mobile-first greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-2xl sm:text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-blue-600 leading-tight">
                  {getGreeting()},
                </h1>
                <div className="flex items-center gap-2">
                  <h2 className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-2xl sm:text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-blue-600">
                    Technician {userName}!
                  </h2>
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 flex-shrink-0"
                  >
                    Technician
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Status and controls - mobile optimized */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              {/* Realtime status */}
              <div
                title={status.connected ? 'Realtime connected' : 'Realtime disconnected'}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  status.connected 
                    ? 'text-green-700 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800' 
                    : 'text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800'
                }`}
                aria-live="polite"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  status.connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                }`} />
                <span className="hidden xs:inline">{status.connected ? 'Online' : 'Offline'}</span>
                <span className="xs:hidden">{status.connected ? '●' : '○'}</span>
              </div>
              
              {/* Notifications */}
              <NotificationsBell />
              
              {/* Date and shift info */}
              <div className="text-right hidden sm:block">
                <div className="text-foreground text-sm font-medium">
                  {formatDashboardDate(new Date(), isMobile ? 'short' : 'long')}
                </div>
                <div className="text-muted-foreground text-xs">
                  Shift: 8:00 AM - 6:00 PM
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile date/shift info */}
          <div className="sm:hidden flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
            <div className="text-sm font-medium">
              {formatDashboardDate(new Date(), 'short')}
            </div>
            <div className="text-xs text-muted-foreground">
              8:00 AM - 6:00 PM
            </div>
          </div>
        </motion.div>

        {/* Enhanced Today's Summary */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title='My Assigned Tasks'
              value={12}
              change={{
                value: '8 in progress, 4 pending',
                trend: 'neutral'
              }}
              icon={<IconClipboardList className='h-5 w-5' />}
              variant='info'
              actionable
              onClick={() =>
                (window.location.href = '/dashboard/batteries/status')
              }
            />

            <MetricCard
              title='Completed Today'
              value={5}
              change={{
                value: 'Great progress!',
                trend: 'up'
              }}
              icon={<IconCircleCheck className='h-5 w-5' />}
              variant='success'
              actionable
              onClick={() =>
                (window.location.href = '/dashboard/batteries?filter=completed')
              }
            />

            <MetricCard
              title='Urgent Repairs'
              value={3}
              change={{
                value: 'Promised for today',
                trend: 'down'
              }}
              icon={<IconAlertTriangle className='h-5 w-5' />}
              variant='danger'
              actionable
              onClick={() =>
                (window.location.href = '/dashboard/batteries?priority=urgent')
              }
            />

            <MetricCard
              title='This Week'
              value={28}
              change={{
                value: 'batteries repaired',
                trend: 'up'
              }}
              icon={<IconCalendar className='h-5 w-5' />}
              variant='elevated'
            />
          </div>
        </motion.div>

        {/* Technician Work Area */}
        <motion.div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2" variants={itemVariants}>
          {/* Inbox */}
          <InboxList onSelect={(id) => openDrawer(id)} />
          {/* My Work */}
          <MyWorkList onSelect={(id) => openDrawer(id)} />
        </motion.div>

        {/* Enhanced Work Progress */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <ProgressCard
              title="Today's Tasks"
              description='Daily repair progress'
              progress={5}
              total={12}
              variant='info'
              animated
            />

            <ProgressCard
              title="This Week's Goal"
              description='Weekly repair target'
              progress={28}
              total={35}
              variant='success'
              animated
            />

            <ProgressCard
              title='Quality Score'
              description='Repair quality rating'
              progress={96}
              variant='elevated'
              animated
            />
          </div>
        </motion.div>

        {/* Enhanced Recent Work & Customer Interactions */}
        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2"
          variants={itemVariants}
        >
          <EnhancedCard variant='success' animated>
            <div className='p-6'>
              <div className='mb-6 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <IconCircleCheck className='h-5 w-5 text-green-600' />
                  <h3 className='text-lg font-semibold'>Recently Completed</h3>
                </div>
                <Button variant='ghost' size='sm' asChild>
                  <Link href='/dashboard/batteries?filter=completed'>
                    View All
                  </Link>
                </Button>
              </div>

              <div className='space-y-3'>
                <motion.div
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border border-green-200 bg-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:bg-green-50/30 hover:shadow-md dark:border-green-800 dark:bg-gray-900/50 dark:hover:bg-gray-800/50 cursor-pointer active:scale-[0.98] touch-manipulation"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/50'>
                    <IconBattery className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>51V 30Ah - Binu</div>
                    <div className='text-muted-foreground text-xs'>
                      Completed{' '}
                      {formatDashboardDate(
                        new Date(Date.now() - 2 * 60 * 60 * 1000)
                      )}
                    </div>
                  </div>
                  <Badge
                    variant='outline'
                    className='border-green-200 text-xs font-medium text-green-600'
                  >
                    ₹3,300
                  </Badge>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border border-green-200 bg-white p-3 sm:p-4 shadow-sm dark:border-green-800 dark:bg-gray-900 cursor-pointer active:scale-[0.98] touch-manipulation"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/50'>
                    <IconBattery className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>72V 26Ah - Mishal</div>
                    <div className='text-muted-foreground text-xs'>
                      Completed{' '}
                      {formatDashboardDate(
                        new Date(Date.now() - 4 * 60 * 60 * 1000)
                      )}
                    </div>
                  </div>
                  <Badge
                    variant='outline'
                    className='border-green-200 text-xs font-medium text-green-600'
                  >
                    ₹4,500
                  </Badge>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border border-green-200 bg-white p-3 sm:p-4 shadow-sm dark:border-green-800 dark:bg-gray-900 cursor-pointer active:scale-[0.98] touch-manipulation"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/50'>
                    <IconBattery className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>TVS 48V 31Ah</div>
                    <div className='text-muted-foreground text-xs'>
                      Cell balancing •{' '}
                      {formatDashboardDate(
                        new Date(Date.now() - 6 * 60 * 60 * 1000)
                      )}
                    </div>
                  </div>
                  <Badge
                    variant='outline'
                    className='border-green-200 text-xs font-medium text-green-600'
                  >
                    ₹1,200
                  </Badge>
                </motion.div>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard variant='info' animated>
            <div className='p-6'>
              <div className='mb-6 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <IconUsers className='h-5 w-5 text-blue-600' />
                  <h3 className='text-lg font-semibold'>
                    Customer Interactions
                  </h3>
                </div>
                <Button variant='ghost' size='sm' asChild>
                  <Link href='/dashboard/customers'>View All</Link>
                </Button>
              </div>

              <div className='space-y-3'>
                <motion.div
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border bg-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:bg-gray-50/50 hover:shadow-md dark:bg-gray-900/50 dark:hover:bg-gray-800/50 cursor-pointer active:scale-[0.98] touch-manipulation"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900/50'>
                    <IconUsers className='h-4 w-4 text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>
                      New customer: Ramees
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      62.9V 30Ah battery assessment
                    </div>
                  </div>
                  <Badge variant='secondary' className='text-xs'>
                    New
                  </Badge>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border bg-white p-3 sm:p-4 shadow-sm dark:bg-gray-900 cursor-pointer active:scale-[0.98] touch-manipulation"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900/50'>
                    <IconClipboardList className='h-4 w-4 text-purple-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>
                      Quote sent to Dhanesh
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      TVS battery repair estimate
                    </div>
                  </div>
                  <Badge variant='outline' className='text-xs'>
                    Quote
                  </Badge>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border bg-white p-3 sm:p-4 shadow-sm dark:bg-gray-900 cursor-pointer active:scale-[0.98] touch-manipulation"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className='rounded-full bg-green-100 p-2 dark:bg-green-900/50'>
                    <IconCircleCheck className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>Delivery to Afzal</div>
                    <div className='text-muted-foreground text-xs'>
                      60V 26Ah repair completed
                    </div>
                  </div>
                  <Badge variant='outline' className='text-xs text-green-600'>
                    Delivered
                  </Badge>
                </motion.div>
              </div>
            </div>
          </EnhancedCard>
        </motion.div>

      {/* Ticket Details Drawer */}
      <TicketDetailsDrawer
        ticketId={selectedTicketId}
        open={drawerOpen}
        onOpenChange={(v) => setDrawerOpen(v)}
      />
      </motion.div>
    </PageContainer>
  );
}
