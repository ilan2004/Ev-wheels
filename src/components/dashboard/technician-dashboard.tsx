'use client';

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
  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Technician';
  const isMobile = useMediaQuery({ maxWidth: 768 });

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
          className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}
          variants={itemVariants}
        >
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <h1 className='bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-blue-600'>
                {getGreeting()}, {userName}!
              </h1>
              <div className='hidden sm:block'>
                <Badge
                  variant='outline'
                  className='border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                >
                  Technician
                </Badge>
              </div>
            </div>
            <p className='text-muted-foreground text-lg'>
              Ready to get some batteries fixed today?
            </p>
          </div>
          <div
            className={`flex items-center gap-4 ${isMobile ? 'justify-between' : ''}`}
          >
            {isMobile && (
              <Badge
                variant='outline'
                className='border-blue-200 bg-blue-50 px-3 py-1 text-blue-700'
              >
                Technician
              </Badge>
            )}
            <div className='text-right'>
              <div className='text-foreground text-sm font-medium'>
                {formatDashboardDate(new Date(), isMobile ? 'short' : 'long')}
              </div>
              <div className='text-muted-foreground text-xs'>
                Shift: 8:00 AM - 6:00 PM
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Today's Summary */}
        <motion.div variants={itemVariants}>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
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

        {/* Enhanced Quick Actions & Priority Tasks */}
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
                Common tasks for battery service
              </p>
              <div className='grid gap-3'>
                <Button
                  asChild
                  variant='default'
                  className='h-12 justify-start'
                >
                  <Link href='/dashboard/job-cards/new'>
                    <IconClipboardList className='mr-3 h-5 w-5' />
                    New Job Card
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-12 justify-start'
                >
                  <Link href='/dashboard/batteries/new'>
                    <IconBattery className='mr-3 h-5 w-5' />
                    New Battery Record
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-12 justify-start'
                >
                  <Link href='/dashboard/invoices/quote/new'>
                    <IconClipboardList className='mr-3 h-5 w-5' />
                    Generate Quote
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-12 justify-start'
                >
                  <Link href='/dashboard/invoices/labels'>
                    <IconPrinter className='mr-3 h-5 w-5' />
                    Print Labels
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='h-12 justify-start'
                >
                  <Link href='/dashboard/customers'>
                    <IconUsers className='mr-3 h-5 w-5' />
                    Customer Lookup
                  </Link>
                </Button>
              </div>
            </div>
          </EnhancedCard>

          <div className='space-y-4'>
            <div className='mb-4 flex items-center gap-2'>
              <IconTool className='h-5 w-5 text-blue-600' />
              <h3 className='text-lg font-semibold'>
                Today&apos;s Priority Tasks
              </h3>
            </div>
            <div className='space-y-3'>
              <StatusCard
                title='72V 39Ah - Basheer'
                description='Promised delivery today'
                status='danger'
                icon={<IconAlertTriangle className='h-4 w-4' />}
                action={{
                  label: 'Start Repair',
                  onClick: () =>
                    (window.location.href = '/dashboard/batteries/repair/1')
                }}
              />

              <StatusCard
                title='60V 26Ah - Gafoor'
                description='Due tomorrow'
                status='warning'
                icon={<IconClock className='h-4 w-4' />}
                action={{
                  label: 'View Details',
                  onClick: () =>
                    (window.location.href = '/dashboard/batteries/repair/2')
                }}
              />

              <StatusCard
                title='48V 30Ah - Jamsheer'
                description='Cell balancing needed'
                status='info'
                icon={<IconBattery className='h-4 w-4' />}
                action={{
                  label: 'Begin Work',
                  onClick: () =>
                    (window.location.href = '/dashboard/batteries/repair/3')
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Work Progress */}
        <motion.div variants={itemVariants}>
          <div className='grid gap-6 md:grid-cols-3'>
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
          className='grid gap-6 md:grid-cols-2'
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
                  className='flex items-center gap-4 rounded-lg border border-green-200 bg-white p-3 shadow-sm transition-all duration-200 hover:bg-green-50/30 hover:shadow-md dark:border-green-800 dark:bg-gray-900/50 dark:hover:bg-gray-800/50'
                  whileHover={{ y: -1 }}
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
                  className='flex items-center gap-4 rounded-lg border border-green-200 bg-white p-3 shadow-sm dark:border-green-800 dark:bg-gray-900'
                  whileHover={{ scale: 1.02, y: -2 }}
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
                  className='flex items-center gap-4 rounded-lg border border-green-200 bg-white p-3 shadow-sm dark:border-green-800 dark:bg-gray-900'
                  whileHover={{ scale: 1.02, y: -2 }}
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
                  className='flex items-center gap-4 rounded-lg border bg-white p-3 shadow-sm transition-all duration-200 hover:bg-gray-50/50 hover:shadow-md dark:bg-gray-900/50 dark:hover:bg-gray-800/50'
                  whileHover={{ y: -1 }}
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
                  className='flex items-center gap-4 rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900'
                  whileHover={{ scale: 1.02, y: -2 }}
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
                  className='flex items-center gap-4 rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900'
                  whileHover={{ scale: 1.02, y: -2 }}
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

        {/* Enhanced Performance Summary */}
        <motion.div variants={itemVariants}>
          <EnhancedCard variant='elevated' animated>
            <div className='p-6'>
              <div className='mb-6 flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold'>Performance Summary</h3>
                  <p className='text-muted-foreground text-sm'>
                    Your work statistics for this month
                  </p>
                </div>
                <Button variant='outline' size='sm' asChild>
                  <Link href='/dashboard/reports/personal'>
                    View Detailed Report
                  </Link>
                </Button>
              </div>

              <div className='grid gap-6 md:grid-cols-3'>
                <motion.div
                  className='rounded-lg border border-blue-200 bg-blue-50 p-6 text-center transition-colors duration-200 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950/40'
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='mb-2 text-3xl font-bold text-blue-600'>
                    134
                  </div>
                  <div className='text-sm font-medium text-blue-700 dark:text-blue-400'>
                    Batteries Repaired
                  </div>
                  <div className='text-muted-foreground mt-1 text-xs'>
                    +12 from last month
                  </div>
                </motion.div>

                <motion.div
                  className='rounded-lg border border-green-200 bg-green-50 p-6 text-center transition-colors duration-200 hover:bg-green-100/50 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/40'
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='mb-2 text-3xl font-bold text-green-600'>
                    98%
                  </div>
                  <div className='text-sm font-medium text-green-700 dark:text-green-400'>
                    Success Rate
                  </div>
                  <div className='text-muted-foreground mt-1 text-xs'>
                    Excellent performance
                  </div>
                </motion.div>

                <motion.div
                  className='rounded-lg border border-purple-200 bg-purple-50 p-6 text-center transition-colors duration-200 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-950/30 dark:hover:bg-purple-950/40'
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className='mb-2 text-3xl font-bold text-purple-600'>
                    ₹1,67,200
                  </div>
                  <div className='text-sm font-medium text-purple-700 dark:text-purple-400'>
                    Revenue Generated
                  </div>
                  <div className='text-muted-foreground mt-1 text-xs'>
                    +18.5% increase
                  </div>
                </motion.div>
              </div>
            </div>
          </EnhancedCard>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
