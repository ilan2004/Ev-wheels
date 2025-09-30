'use client';

import React from 'react';
import {
  IconClipboardList,
  IconAlertTriangle,
  IconBattery,
  IconTrendingUp
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface EssentialKPIData {
  overdue: number;
  dueToday: number;
  openTickets: number;
  weeklyCompleted: number;
}

interface EssentialKPIsProps {
  data: EssentialKPIData;
  onMetricClick?: (metric: keyof EssentialKPIData) => void;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  icon,
  variant,
  onClick,
  loading = false,
  subtitle
}: MetricCardProps) {
  const variants = {
    critical: {
      cardClass: 'border-red-200 bg-red-50/50 hover:bg-red-50',
      iconClass: 'text-red-600',
      valueClass: 'text-red-700',
      titleClass: 'text-red-600',
      badge: value > 0 ? ('destructive' as const) : undefined
    },
    warning: {
      cardClass: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
      iconClass: 'text-amber-600',
      valueClass: 'text-amber-700',
      titleClass: 'text-amber-600',
      badge: value > 0 ? ('secondary' as const) : undefined
    },
    info: {
      cardClass: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50',
      iconClass: 'text-blue-600',
      valueClass: 'text-blue-700',
      titleClass: 'text-blue-600',
      badge: undefined
    },
    success: {
      cardClass: 'border-green-200 bg-green-50/50 hover:bg-green-50',
      iconClass: 'text-green-600',
      valueClass: 'text-green-700',
      titleClass: 'text-green-600',
      badge: undefined
    }
  };

  const style = variants[variant];

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
      <Card
        className={`${style.cardClass} transition-all duration-200 ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className='p-4 sm:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className={`${style.iconClass}`}>{icon}</div>
              <div>
                <div className={`text-sm font-medium ${style.titleClass}`}>
                  {title}
                </div>
                {subtitle && (
                  <div className='text-muted-foreground text-xs'>
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
            <div className='text-right'>
              <div
                className={`text-2xl font-bold sm:text-3xl ${style.valueClass}`}
              >
                {loading ? '—' : value}
              </div>
              {style.badge && value > 0 && (
                <Badge variant={style.badge} className='text-xs'>
                  Needs Action
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className='animate-pulse'>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='bg-muted h-5 w-5 rounded'></div>
                <div>
                  <div className='bg-muted h-4 w-20 rounded'></div>
                  <div className='bg-muted mt-1 h-3 w-16 rounded'></div>
                </div>
              </div>
              <div className='bg-muted h-8 w-8 rounded'></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EssentialKPIs({
  data,
  onMetricClick,
  loading = false
}: EssentialKPIsProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  const metrics = [
    {
      key: 'overdue' as const,
      title: 'Overdue',
      value: data.overdue,
      icon: <IconAlertTriangle className='h-5 w-5' />,
      variant: 'critical' as const,
      subtitle: 'Immediate action'
    },
    {
      key: 'dueToday' as const,
      title: 'Due Today',
      value: data.dueToday,
      icon: <IconClipboardList className='h-5 w-5' />,
      variant: 'warning' as const,
      subtitle: 'Focus for today'
    },
    {
      key: 'openTickets' as const,
      title: 'Open Tickets',
      value: data.openTickets,
      icon: <IconBattery className='h-5 w-5' />,
      variant: 'info' as const,
      subtitle: 'Total workload'
    },
    {
      key: 'weeklyCompleted' as const,
      title: 'Completed',
      value: data.weeklyCompleted,
      icon: <IconTrendingUp className='h-5 w-5' />,
      variant: 'success' as const,
      subtitle: 'This week'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='mb-6'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              variant={metric.variant}
              subtitle={metric.subtitle}
              onClick={
                onMetricClick ? () => onMetricClick(metric.key) : undefined
              }
            />
          </motion.div>
        ))}
      </div>

      {/* Quick Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className='mt-4 text-center'
      >
        <div className='text-muted-foreground text-sm'>
          {data.overdue > 0 ? (
            <span className='font-medium text-red-600'>
              🚨 {data.overdue} overdue ticket{data.overdue !== 1 ? 's' : ''}{' '}
              need immediate attention
            </span>
          ) : data.dueToday > 0 ? (
            <span className='font-medium text-amber-600'>
              📋 {data.dueToday} ticket{data.dueToday !== 1 ? 's' : ''} due
              today
            </span>
          ) : (
            <span className='font-medium text-green-600'>
              ✅ No overdue tickets - great job!
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
