'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

// Enhanced card variants with semantic styling
export type CardVariant = 'default' | 'elevated' | 'success' | 'warning' | 'danger' | 'info';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

const cardVariants = {
  default: 'border-border bg-card hover:shadow-md hover:shadow-black/5 dark:hover:shadow-white/5 transition-shadow duration-200',
  elevated: 'border-border bg-card shadow-lg hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10 transition-shadow duration-200 ring-1 ring-black/5 dark:ring-white/5',
  success: 'border-green-200 bg-green-50/50 hover:bg-green-50/70 dark:hover:bg-green-950/40 shadow-md dark:border-green-800 dark:bg-green-950/30 transition-colors duration-200',
  warning: 'border-orange-200 bg-orange-50/50 hover:bg-orange-50/70 dark:hover:bg-orange-950/40 shadow-md dark:border-orange-800 dark:bg-orange-950/30 transition-colors duration-200',
  danger: 'border-red-200 bg-red-50/50 hover:bg-red-50/70 dark:hover:bg-red-950/40 shadow-md dark:border-red-800 dark:bg-red-950/30 transition-colors duration-200',
  info: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 shadow-md dark:border-blue-800 dark:bg-blue-950/30 transition-colors duration-200'
};

const cardSizes = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8', 
  xl: 'p-10'
};

interface EnhancedCardProps extends React.ComponentProps<typeof Card> {
  variant?: CardVariant;
  size?: CardSize;
  animated?: boolean;
  hoverable?: boolean;
}

export function EnhancedCard({ 
  className, 
  variant = 'default', 
  size = 'md',
  animated = false,
  hoverable = false,
  children, 
  ...props 
}: EnhancedCardProps) {
  const cardClasses = cn(
    cardVariants[variant],
    cardSizes[size],
    hoverable && 'cursor-pointer hover:scale-[1.01] hover:border-opacity-70 transition-all duration-200 ease-out',
    className
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cardClasses} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className={cardClasses} {...props}>
      {children}
    </Card>
  );
}

// Metric Card for displaying key statistics
export type MetricAccent = 'batteries' | 'customers' | 'revenue' | 'repairs';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  animated?: boolean;
  loading?: boolean;
  actionable?: boolean;
  onClick?: () => void;
  accent?: MetricAccent; // controls subtle icon chip color
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  variant = 'elevated',
  size = 'md',
  animated = true,
  loading = false,
  actionable = false,
  onClick,
  accent
}: MetricCardProps) {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'neutral': return '→';
    }
  };

  const getChipStyles = (accent?: MetricAccent) => {
    if (!accent) return {} as React.CSSProperties;
    const strongVar = `var(--kpi-${accent}-strong)`;
    const tintVar = `var(--kpi-${accent}-tint)`;
    return {
      backgroundColor: tintVar,
      color: strongVar
    } as React.CSSProperties;
  };

  if (loading) {
    return (
      <EnhancedCard variant={variant} size={size} animated={animated}>
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
            {icon && (
              <div className="animate-pulse bg-muted h-6 w-6 rounded"></div>
            )}
          </div>
          <div className="space-y-1">
            <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
            <div className="animate-pulse bg-muted h-3 w-20 rounded"></div>
          </div>
        </div>
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard 
      variant={variant} 
      size={size} 
      animated={animated}
      hoverable={actionable}
      onClick={onClick}
      className={cn(actionable ? 'cursor-pointer' : '', accent && 'kpi-card')}
      style={accent ? ({ ['--kpi-accent' as any]: `var(--kpi-${accent}-strong)` } as React.CSSProperties) : undefined}
    >
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
          {icon && (
            <div
              className={cn(
                'h-8 w-8 rounded-full grid place-items-center',
                accent ? '' : 'text-muted-foreground bg-muted'
              )}
              style={getChipStyles(accent)}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
          {change && (
            <p className={cn("text-xs flex items-center gap-1", getTrendColor(change.trend))}>
              <span>{getTrendIcon(change.trend)}</span>
              {change.value}
            </p>
          )}
        </div>
      </div>
    </EnhancedCard>
  );
}

// Status Card for displaying alerts and notifications
interface StatusCardProps {
  title: string;
  description: string;
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  animated?: boolean;
}

export function StatusCard({
  title,
  description,
  status,
  icon,
  action,
  dismissible = false,
  onDismiss,
  animated = true
}: StatusCardProps) {
  const getStatusVariant = (status: string): CardVariant => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      success: { variant: 'default' as const, label: 'Success' },
      warning: { variant: 'secondary' as const, label: 'Warning' },
      danger: { variant: 'destructive' as const, label: 'Critical' },
      info: { variant: 'secondary' as const, label: 'Info' },
      neutral: { variant: 'outline' as const, label: 'Update' }
    };
    return configs[status as keyof typeof configs] || configs.neutral;
  };

  const badgeConfig = getStatusBadge(status);

  return (
    <EnhancedCard 
      variant={getStatusVariant(status)} 
      animated={animated}
      className="relative"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">
                  {title}
                </CardTitle>
                <Badge variant={badgeConfig.variant} className="text-xs">
                  {badgeConfig.label}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>
      {action && (
        <CardContent className="pt-0">
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-primary hover:underline"
          >
            {action.label}
          </button>
        </CardContent>
      )}
    </EnhancedCard>
  );
}

// Progress Card for showing task completion
interface ProgressCardProps {
  title: string;
  description?: string;
  progress: number;
  total?: number;
  variant?: CardVariant;
  animated?: boolean;
  showPercentage?: boolean;
}

export function ProgressCard({
  title,
  description,
  progress,
  total,
  variant = 'default',
  animated = true,
  showPercentage = true
}: ProgressCardProps) {
  const percentage = total ? Math.round((progress / total) * 100) : progress;
  
  return (
    <EnhancedCard variant={variant} animated={animated}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-base font-medium mb-1">
              {title}
            </div>
            {description && (
              <div className="text-sm text-muted-foreground">
                {description}
              </div>
            )}
          </div>
          {showPercentage && (
            <div className="text-2xl font-bold text-muted-foreground">
              {percentage}%
            </div>
          )}
        </div>
        <div className="space-y-2">
          {total && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress} of {total} completed</span>
            </div>
          )}
          <div className="w-full bg-muted rounded-full h-2.5">
            <motion.div
              className="bg-primary h-2.5 rounded-full transition-all duration-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </EnhancedCard>
  );
}
