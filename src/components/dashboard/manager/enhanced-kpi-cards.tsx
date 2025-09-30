'use client';

import React from 'react';
import {
  IconClipboardList,
  IconAlertTriangle,
  IconBattery,
  IconTrendingUp,
  IconArrowUpRight,
  IconArrowDownRight
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EssentialKPIData {
  overdue: number;
  dueToday: number;
  openTickets: number;
  weeklyCompleted: number;
}

interface EnhancedKPIsProps {
  data: EssentialKPIData;
  onMetricClick?: (metric: keyof EssentialKPIData) => void;
  loading?: boolean;
  variant?: 'default' | 'compact' | 'detailed' | 'glassmorphic' | 'neon';
}

// Design Variant 1: Glassmorphic Style
function GlassmorphicKPICard({
  title,
  value,
  icon,
  variant,
  onClick,
  loading = false,
  trend,
  subtitle
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  loading?: boolean;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
}) {
  const variants = {
    critical: {
      gradient: 'from-red-500/10 via-red-500/5 to-transparent',
      border: 'border-red-500/20 hover:border-red-500/30',
      shadow: 'shadow-red-500/5',
      iconBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
      valueColor: 'text-red-700 dark:text-red-300',
      titleColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      border: 'border-amber-500/20 hover:border-amber-500/30',
      shadow: 'shadow-amber-500/5',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-700 dark:text-amber-300',
      titleColor: 'text-amber-600 dark:text-amber-400'
    },
    info: {
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      border: 'border-blue-500/20 hover:border-blue-500/30',
      shadow: 'shadow-blue-500/5',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-700 dark:text-blue-300',
      titleColor: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      gradient: 'from-green-500/10 via-green-500/5 to-transparent',
      border: 'border-green-500/20 hover:border-green-500/30',
      shadow: 'shadow-green-500/5',
      iconBg: 'bg-green-500/10 text-green-600 dark:text-green-400',
      valueColor: 'text-green-700 dark:text-green-300',
      titleColor: 'text-green-600 dark:text-green-400'
    }
  };

  const style = variants[variant];

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className='group'
    >
      <Card
        className={cn(
          'relative bg-gradient-to-br backdrop-blur-sm',
          style.gradient,
          style.border,
          style.shadow,
          'transition-all duration-300 hover:shadow-lg',
          'border bg-white/50 dark:bg-gray-900/50',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <CardContent className='p-6'>
          {/* Header */}
          <div className='mb-4 flex items-center justify-between'>
            <div
              className={cn(
                'rounded-lg p-2 transition-all duration-200',
                style.iconBg,
                'group-hover:scale-110'
              )}
            >
              {icon}
            </div>
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend.direction === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.direction === 'up' ? (
                  <IconArrowUpRight className='h-3 w-3' />
                ) : (
                  <IconArrowDownRight className='h-3 w-3' />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>

          {/* Value */}
          <div className='mb-2'>
            <div
              className={cn(
                'font-mono text-3xl leading-none font-bold',
                style.valueColor
              )}
            >
              {loading ? '—' : value.toLocaleString()}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div>
            <div className={cn('text-sm font-medium', style.titleColor)}>
              {title}
            </div>
            {subtitle && (
              <div className='text-muted-foreground mt-1 text-xs'>
                {subtitle}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Design Variant 2: Neon/Gaming Style
function NeonKPICard({
  title,
  value,
  icon,
  variant,
  onClick,
  loading = false,
  subtitle
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}) {
  const variants = {
    critical: {
      glow: 'shadow-red-500/20 hover:shadow-red-500/40',
      border: 'border-red-500/30 hover:border-red-500/50',
      bg: 'bg-gray-900/80 hover:bg-gray-800/80',
      accent: 'bg-red-500/20',
      textGlow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
      valueColor: 'text-red-400',
      titleColor: 'text-red-300'
    },
    warning: {
      glow: 'shadow-amber-500/20 hover:shadow-amber-500/40',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      bg: 'bg-gray-900/80 hover:bg-gray-800/80',
      accent: 'bg-amber-500/20',
      textGlow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      valueColor: 'text-amber-400',
      titleColor: 'text-amber-300'
    },
    info: {
      glow: 'shadow-blue-500/20 hover:shadow-blue-500/40',
      border: 'border-blue-500/30 hover:border-blue-500/50',
      bg: 'bg-gray-900/80 hover:bg-gray-800/80',
      accent: 'bg-blue-500/20',
      textGlow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
      valueColor: 'text-blue-400',
      titleColor: 'text-blue-300'
    },
    success: {
      glow: 'shadow-green-500/20 hover:shadow-green-500/40',
      border: 'border-green-500/30 hover:border-green-500/50',
      bg: 'bg-gray-900/80 hover:bg-gray-800/80',
      accent: 'bg-green-500/20',
      textGlow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]',
      valueColor: 'text-green-400',
      titleColor: 'text-green-300'
    }
  };

  const style = variants[variant];

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className='group'
    >
      <Card
        className={cn(
          'relative overflow-hidden',
          style.bg,
          style.border,
          style.glow,
          'transition-all duration-300 hover:shadow-xl',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        {/* Accent Line */}
        <div
          className={cn('absolute top-0 right-0 left-0 h-[2px]', style.accent)}
        />

        <CardContent className='relative p-6'>
          {/* Background Pattern */}
          <div className='absolute inset-0 opacity-5'>
            <div className='absolute inset-0 bg-gradient-to-br from-white/10 to-transparent' />
          </div>

          <div className='relative'>
            {/* Header */}
            <div className='mb-4 flex items-center gap-3'>
              <div className='text-gray-400 transition-transform duration-200 group-hover:scale-110'>
                {icon}
              </div>
              <div
                className={cn(
                  'font-mono text-xs tracking-wider uppercase',
                  style.titleColor
                )}
              >
                {title}
              </div>
            </div>

            {/* Value */}
            <div
              className={cn(
                'mb-2 font-mono text-4xl leading-none font-black',
                style.valueColor,
                style.textGlow,
                'transition-transform duration-200 group-hover:scale-105'
              )}
            >
              {loading ? '—' : value.toLocaleString()}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div className='font-mono text-xs tracking-wide text-gray-500 uppercase'>
                {subtitle}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Design Variant 3: Minimal Clean
function CleanKPICard({
  title,
  value,
  icon,
  variant,
  onClick,
  loading = false,
  subtitle,
  trend
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
  trend?: { value: number; direction: 'up' | 'down' };
}) {
  const variants = {
    critical: {
      valueColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-500',
      bgHover: 'hover:bg-red-50 dark:hover:bg-red-950/20',
      border: 'border-l-4 border-l-red-500'
    },
    warning: {
      valueColor: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-500',
      bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
      border: 'border-l-4 border-l-amber-500'
    },
    info: {
      valueColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-500',
      bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-950/20',
      border: 'border-l-4 border-l-blue-500'
    },
    success: {
      valueColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-500',
      bgHover: 'hover:bg-green-50 dark:hover:bg-green-950/20',
      border: 'border-l-4 border-l-green-500'
    }
  };

  const style = variants[variant];

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.01 : 1 }}
      whileTap={{ scale: onClick ? 0.99 : 1 }}
    >
      <Card
        className={cn(
          'bg-card border-0 shadow-sm transition-all duration-200 hover:shadow-md',
          style.bgHover,
          style.border,
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <CardContent className='p-6'>
          <div className='flex items-start justify-between'>
            <div className='space-y-3'>
              <div
                className={cn('bg-background rounded-lg p-2', style.iconColor)}
              >
                {icon}
              </div>
              <div>
                <div
                  className={cn(
                    'font-mono text-3xl leading-none font-bold tracking-tight',
                    style.valueColor
                  )}
                >
                  {loading ? '—' : value.toLocaleString()}
                </div>
                <div className='text-foreground mt-1 text-sm font-medium'>
                  {title}
                </div>
                {subtitle && (
                  <div className='text-muted-foreground text-xs'>
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                  trend.direction === 'up'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                )}
              >
                {trend.direction === 'up' ? (
                  <IconArrowUpRight className='h-3 w-3' />
                ) : (
                  <IconArrowDownRight className='h-3 w-3' />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Design Variant 4: Detailed Dashboard Style
function DetailedKPICard({
  title,
  value,
  icon,
  variant,
  onClick,
  loading = false,
  subtitle,
  progress,
  target
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
  progress?: number;
  target?: number;
}) {
  const variants = {
    critical: {
      gradient:
        'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30',
      valueColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-600 dark:text-red-400',
      progressColor: 'bg-red-500'
    },
    warning: {
      gradient:
        'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30',
      valueColor: 'text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
      progressColor: 'bg-amber-500'
    },
    info: {
      gradient:
        'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30',
      valueColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
      progressColor: 'bg-blue-500'
    },
    success: {
      gradient:
        'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30',
      valueColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-600 dark:text-green-400',
      progressColor: 'bg-green-500'
    }
  };

  const style = variants[variant];
  const progressPercentage = target
    ? Math.min((value / target) * 100, 100)
    : progress || 0;

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1, y: -2 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
      <Card
        className={cn(
          style.gradient,
          'border shadow-sm transition-all duration-300 hover:shadow-lg',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {/* Header */}
            <div className='flex items-center justify-between'>
              <div
                className={cn(
                  'rounded-full bg-white/50 p-3 dark:bg-black/20',
                  style.iconColor
                )}
              >
                {icon}
              </div>
              {target && (
                <div className='text-muted-foreground text-right text-xs'>
                  Target: {target.toLocaleString()}
                </div>
              )}
            </div>

            {/* Value */}
            <div>
              <div
                className={cn(
                  'font-mono text-3xl leading-none font-bold',
                  style.valueColor
                )}
              >
                {loading ? '—' : value.toLocaleString()}
              </div>
              <div className='text-foreground/80 mt-1 text-sm font-medium'>
                {title}
              </div>
              {subtitle && (
                <div className='text-muted-foreground text-xs'>{subtitle}</div>
              )}
            </div>

            {/* Progress Bar */}
            {(progress !== undefined || target) && (
              <div className='space-y-1'>
                <div className='text-muted-foreground flex justify-between text-xs'>
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className='h-2 w-full rounded-full bg-black/10 dark:bg-white/10'>
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      style.progressColor
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Enhanced KPIs Component
export function EnhancedKPIs({
  data,
  onMetricClick,
  loading = false,
  variant = 'glassmorphic'
}: EnhancedKPIsProps) {
  const metrics = [
    {
      key: 'overdue' as const,
      title: 'Overdue',
      value: data.overdue,
      icon: <IconAlertTriangle className='h-5 w-5' />,
      variant: 'critical' as const,
      subtitle: 'Immediate action required',
      trend: { value: 12, direction: 'down' as const }, // Mock data
      target: 0 // Target is 0 overdue tickets
    },
    {
      key: 'dueToday' as const,
      title: 'Due Today',
      value: data.dueToday,
      icon: <IconClipboardList className='h-5 w-5' />,
      variant: 'warning' as const,
      subtitle: 'Focus for today',
      trend: { value: 8, direction: 'up' as const },
      target: 10
    },
    {
      key: 'openTickets' as const,
      title: 'Open Tickets',
      value: data.openTickets,
      icon: <IconBattery className='h-5 w-5' />,
      variant: 'info' as const,
      subtitle: 'Total active workload',
      target: 50
    },
    {
      key: 'weeklyCompleted' as const,
      title: 'Completed',
      value: data.weeklyCompleted,
      icon: <IconTrendingUp className='h-5 w-5' />,
      variant: 'success' as const,
      subtitle: 'This week',
      trend: { value: 25, direction: 'up' as const },
      target: 40
    }
  ];

  const renderCard = (metric: (typeof metrics)[0], index: number) => {
    const cardProps = {
      title: metric.title,
      value: metric.value,
      icon: metric.icon,
      variant: metric.variant,
      subtitle: metric.subtitle,
      onClick: onMetricClick ? () => onMetricClick(metric.key) : undefined,
      loading
    };

    return (
      <motion.div
        key={metric.key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.05 }}
      >
        {variant === 'glassmorphic' && (
          <GlassmorphicKPICard {...cardProps} trend={metric.trend} />
        )}
        {variant === 'neon' && <NeonKPICard {...cardProps} />}
        {variant === 'compact' && (
          <CleanKPICard {...cardProps} trend={metric.trend} />
        )}
        {variant === 'detailed' && (
          <DetailedKPICard {...cardProps} target={metric.target} />
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-6'>
              <div className='space-y-4'>
                <div className='bg-muted h-5 w-5 rounded'></div>
                <div className='space-y-2'>
                  <div className='bg-muted h-8 w-16 rounded'></div>
                  <div className='bg-muted h-4 w-20 rounded'></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className='mb-6'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {metrics.map(renderCard)}
      </div>

      {/* Enhanced Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className='mt-6 text-center'
      >
        <div className='bg-muted/50 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm'>
          {data.overdue > 0 ? (
            <>
              <span className='flex h-2 w-2 animate-pulse rounded-full bg-red-500'></span>
              <span className='font-medium text-red-600 dark:text-red-400'>
                {data.overdue} overdue ticket{data.overdue !== 1 ? 's' : ''}{' '}
                need immediate attention
              </span>
            </>
          ) : data.dueToday > 0 ? (
            <>
              <span className='flex h-2 w-2 rounded-full bg-amber-500'></span>
              <span className='font-medium text-amber-600 dark:text-amber-400'>
                {data.dueToday} ticket{data.dueToday !== 1 ? 's' : ''} due today
              </span>
            </>
          ) : (
            <>
              <span className='flex h-2 w-2 rounded-full bg-green-500'></span>
              <span className='font-medium text-green-600 dark:text-green-400'>
                All caught up! No overdue tickets.
              </span>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
