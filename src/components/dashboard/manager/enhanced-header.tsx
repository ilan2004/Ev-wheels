'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconClipboardList,
  IconAlertTriangle,
  IconChartBar,
  IconBell,
  IconCalendarEvent
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useLocationContext } from '@/lib/location/context';

interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  imageUrl: string;
  publicMetadata: Record<string, any>;
}

interface EnhancedHeaderProps {
  user: SerializedUser;
  urgentAlerts?: number;
  todaysSummary?: {
    dueToday: number;
    overdue: number;
    completed: number;
  };
  onEmergencyToggle?: () => void;
  emergencyMode?: boolean;
}

export function EnhancedHeader({
  user,
  urgentAlerts = 0,
  todaysSummary,
  onEmergencyToggle,
  emergencyMode = false
}: EnhancedHeaderProps) {
  const { activeLocationName } = useLocationContext();

  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Manager';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='mb-6 space-y-4'
    >
      {/* Main Header */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Hello, {userName}
            </h1>
            <Badge variant='secondary' className='hidden sm:inline-flex'>
              Manager
            </Badge>
            {activeLocationName && (
              <Badge variant='outline' className='hidden md:inline-flex'>
                {activeLocationName}
              </Badge>
            )}
          </div>
          <div className='mt-1 flex items-center gap-4'>
            <p className='text-muted-foreground text-sm md:text-base'>
              {emergencyMode ? (
                <span className='font-medium text-red-600'>
                  🚨 Emergency Mode Active
                </span>
              ) : (
                'Here&apos;s your operation overview and quick actions'
              )}
            </p>
            {todaysSummary && (
              <div className='text-muted-foreground hidden items-center gap-2 text-sm lg:flex'>
                <IconCalendarEvent className='h-4 w-4' />
                <span>
                  Today: {todaysSummary.completed} done,{' '}
                  {todaysSummary.dueToday} due
                  {todaysSummary.overdue > 0 && (
                    <span className='font-medium text-red-600'>
                      , {todaysSummary.overdue} overdue
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notification Badge */}
        {urgentAlerts > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className='flex items-center gap-2'
          >
            <div className='relative'>
              <IconBell className='text-muted-foreground h-6 w-6' />
              <Badge
                variant='destructive'
                className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs'
              >
                {urgentAlerts > 9 ? '9+' : urgentAlerts}
              </Badge>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className='flex flex-wrap items-center gap-2 md:gap-3'>
        {/* Primary Actions */}
        <Button asChild size='sm' className='font-medium'>
          <Link href='/dashboard/job-cards/new'>
            <IconClipboardList className='mr-2 h-4 w-4' />
            New Job Card
          </Link>
        </Button>

        <Button
          variant={emergencyMode ? 'destructive' : 'outline'}
          size='sm'
          onClick={onEmergencyToggle}
          className={`font-medium ${emergencyMode ? 'animate-pulse' : ''}`}
        >
          <IconAlertTriangle className='mr-2 h-4 w-4' />
          {emergencyMode ? 'Exit Emergency' : 'Emergency Mode'}
        </Button>

        {/* Secondary Actions */}
        <div className='hidden items-center gap-2 sm:flex'>
          <Button variant='ghost' size='sm'>
            <IconChartBar className='mr-2 h-4 w-4' />
            Today&apos;s Report
          </Button>
        </div>

        {/* Mobile Menu for Additional Actions */}
        <div className='sm:hidden'>
          <Button variant='ghost' size='sm'>
            <IconChartBar className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className='rounded-lg border border-red-200 bg-red-50 p-3'
        >
          <div className='flex items-center gap-2'>
            <IconAlertTriangle className='h-5 w-5 text-red-600' />
            <div>
              <p className='text-sm font-medium text-red-800'>
                Emergency Mode Active
              </p>
              <p className='text-xs text-red-600'>
                All non-critical tasks are hidden. Focus on overdue and
high-priority job cards.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
