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
import { 
  formatDashboardDate, 
  getLayoutClasses
} from '@/lib/dashboard-utils';

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
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Technician';
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
        initial="hidden"
        animate="visible"
      >
      {/* Enhanced Welcome Header */}
      <motion.div 
        className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-600">
              {getGreeting()}, {userName}!
            </h1>
            <div className="hidden sm:block">
              <Badge variant="outline" className="px-3 py-1 border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                Technician
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Ready to get some batteries fixed today?
          </p>
        </div>
        <div className={`flex items-center gap-4 ${isMobile ? 'justify-between' : ''}`}>
          {isMobile && (
            <Badge variant="outline" className="px-3 py-1 border-blue-200 text-blue-700 bg-blue-50">
              Technician
            </Badge>
          )}
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {formatDashboardDate(new Date(), isMobile ? 'short' : 'long')}
            </div>
            <div className="text-xs text-muted-foreground">
              Shift: 8:00 AM - 6:00 PM
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Today's Summary */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="My Assigned Tasks"
            value={12}
            change={{
              value: "8 in progress, 4 pending",
              trend: "neutral"
            }}
            icon={<IconClipboardList className="h-5 w-5" />}
            variant="info"
            actionable
            onClick={() => window.location.href = '/dashboard/batteries/status'}
          />
          
          <MetricCard
            title="Completed Today"
            value={5}
            change={{
              value: "Great progress!",
              trend: "up"
            }}
            icon={<IconCircleCheck className="h-5 w-5" />}
            variant="success"
            actionable
            onClick={() => window.location.href = '/dashboard/batteries?filter=completed'}
          />
          
          <MetricCard
            title="Urgent Repairs"
            value={3}
            change={{
              value: "Promised for today",
              trend: "down"
            }}
            icon={<IconAlertTriangle className="h-5 w-5" />}
            variant="danger"
            actionable
            onClick={() => window.location.href = '/dashboard/batteries?priority=urgent'}
          />
          
          <MetricCard
            title="This Week"
            value={28}
            change={{
              value: "batteries repaired",
              trend: "up"
            }}
            icon={<IconCalendar className="h-5 w-5" />}
            variant="elevated"
          />
        </div>
      </motion.div>

      {/* Enhanced Quick Actions & Priority Tasks */}
      <motion.div 
        className="grid gap-6 md:grid-cols-2"
        variants={itemVariants}
      >
        <EnhancedCard variant="elevated" animated>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconPlus className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Common tasks for battery service
            </p>
            <div className="grid gap-3">
              <Button asChild variant="default" className="justify-start h-12">
                <Link href="/dashboard/batteries/new">
                  <IconBattery className="mr-3 h-5 w-5" />
                  New Battery Record
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/invoices/quote/new">
                  <IconClipboardList className="mr-3 h-5 w-5" />
                  Generate Quote
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/invoices/labels">
                  <IconPrinter className="mr-3 h-5 w-5" />
                  Print Labels
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-12">
                <Link href="/dashboard/customers">
                  <IconUsers className="mr-3 h-5 w-5" />
                  Customer Lookup
                </Link>
              </Button>
            </div>
          </div>
        </EnhancedCard>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <IconTool className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Today&apos;s Priority Tasks</h3>
          </div>
          <div className="space-y-3">
            <StatusCard
              title="72V 39Ah - Basheer"
              description="Promised delivery today"
              status="danger"
              icon={<IconAlertTriangle className="h-4 w-4" />}
              action={{
                label: "Start Repair",
                onClick: () => window.location.href = '/dashboard/batteries/repair/1'
              }}
            />
            
            <StatusCard
              title="60V 26Ah - Gafoor"
              description="Due tomorrow"
              status="warning"
              icon={<IconClock className="h-4 w-4" />}
              action={{
                label: "View Details",
                onClick: () => window.location.href = '/dashboard/batteries/repair/2'
              }}
            />
            
            <StatusCard
              title="48V 30Ah - Jamsheer"
              description="Cell balancing needed"
              status="info"
              icon={<IconBattery className="h-4 w-4" />}
              action={{
                label: "Begin Work",
                onClick: () => window.location.href = '/dashboard/batteries/repair/3'
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Enhanced Work Progress */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-6 md:grid-cols-3">
          <ProgressCard
            title="Today's Tasks"
            description="Daily repair progress"
            progress={5}
            total={12}
            variant="info"
            animated
          />
          
          <ProgressCard
            title="This Week's Goal"
            description="Weekly repair target"
            progress={28}
            total={35}
            variant="success"
            animated
          />
          
          <ProgressCard
            title="Quality Score"
            description="Repair quality rating"
            progress={96}
            variant="elevated"
            animated
          />
        </div>
      </motion.div>

      {/* Enhanced Recent Work & Customer Interactions */}
      <motion.div 
        className="grid gap-6 md:grid-cols-2"
        variants={itemVariants}
      >
        <EnhancedCard variant="success" animated>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Recently Completed</h3>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/batteries?filter=completed">
                  View All
                </Link>
              </Button>
            </div>
            
            <div className="space-y-3">
              <motion.div 
                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900/50 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md hover:bg-green-50/30 dark:hover:bg-gray-800/50 transition-all duration-200"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <IconBattery className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">51V 30Ah - Binu</div>
                  <div className="text-xs text-muted-foreground">
                    Completed {formatDashboardDate(new Date(Date.now() - 2 * 60 * 60 * 1000))}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-medium text-green-600 border-green-200">₹3,300</Badge>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <IconBattery className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">72V 26Ah - Mishal</div>
                  <div className="text-xs text-muted-foreground">
                    Completed {formatDashboardDate(new Date(Date.now() - 4 * 60 * 60 * 1000))}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-medium text-green-600 border-green-200">₹4,500</Badge>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <IconBattery className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">TVS 48V 31Ah</div>
                  <div className="text-xs text-muted-foreground">
                    Cell balancing • {formatDashboardDate(new Date(Date.now() - 6 * 60 * 60 * 1000))}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-medium text-green-600 border-green-200">₹1,200</Badge>
              </motion.div>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard variant="info" animated>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <IconUsers className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Customer Interactions</h3>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/customers">
                  View All
                </Link>
              </Button>
            </div>
            
            <div className="space-y-3">
              <motion.div 
                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900/50 border shadow-sm hover:shadow-md hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <IconUsers className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">New customer: Ramees</div>
                  <div className="text-xs text-muted-foreground">62.9V 30Ah battery assessment</div>
                </div>
                <Badge variant="secondary" className="text-xs">New</Badge>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900 border shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  <IconClipboardList className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Quote sent to Dhanesh</div>
                  <div className="text-xs text-muted-foreground">TVS battery repair estimate</div>
                </div>
                <Badge variant="outline" className="text-xs">Quote</Badge>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900 border shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <IconCircleCheck className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Delivery to Afzal</div>
                  <div className="text-xs text-muted-foreground">60V 26Ah repair completed</div>
                </div>
                <Badge variant="outline" className="text-xs text-green-600">Delivered</Badge>
              </motion.div>
            </div>
          </div>
        </EnhancedCard>
      </motion.div>

      {/* Enhanced Performance Summary */}
      <motion.div variants={itemVariants}>
        <EnhancedCard variant="elevated" animated>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Performance Summary</h3>
                <p className="text-sm text-muted-foreground">Your work statistics for this month</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/reports/personal">
                  View Detailed Report
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div 
                className="text-center p-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-colors duration-200"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">134</div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Batteries Repaired</div>
                <div className="text-xs text-muted-foreground mt-1">+12 from last month</div>
              </motion.div>
              
              <motion.div 
                className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:bg-green-100/50 dark:hover:bg-green-950/40 transition-colors duration-200"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                <div className="text-sm font-medium text-green-700 dark:text-green-400">Success Rate</div>
                <div className="text-xs text-muted-foreground mt-1">Excellent performance</div>
              </motion.div>
              
              <motion.div 
                className="text-center p-6 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 hover:bg-purple-100/50 dark:hover:bg-purple-950/40 transition-colors duration-200"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="text-3xl font-bold text-purple-600 mb-2">₹1,67,200</div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-400">Revenue Generated</div>
                <div className="text-xs text-muted-foreground mt-1">+18.5% increase</div>
              </motion.div>
            </div>
          </div>
        </EnhancedCard>
      </motion.div>
      </motion.div>
    </PageContainer>
  );
}
