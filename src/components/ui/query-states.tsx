// E-Wheels Performance Optimization: Query State UI Components
// Phase 4: Full React Query Integration - Loading & Error States

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  IconRefresh, 
  IconAlertTriangle, 
  IconWifi, 
  IconBattery,
  IconUsers,
  IconTrendingUp,
  IconLoader2
} from '@tabler/icons-react';

/**
 * Generic loading skeleton component
 */
export interface SkeletonProps {
  lines?: number;
  height?: number;
  className?: string;
  animated?: boolean;
}

export function LoadingSkeleton({ 
  lines = 3, 
  height = 20, 
  className = '',
  animated = true 
}: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className={`h-${height} w-full ${animated ? 'animate-pulse' : ''}`}
        />
      ))}
    </div>
  );
}

/**
 * Dashboard KPI loading skeleton
 */
export function DashboardKpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Chart loading skeleton
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className={`h-${height} w-full`} />
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Battery list loading skeleton
 */
export function BatteryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading spinner with message
 */
export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <IconLoader2 className={`animate-spin ${sizeClasses[size]} text-primary`} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}

/**
 * Error display component with retry functionality
 */
export interface ErrorDisplayProps {
  error: Error | unknown;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return (
    <Alert variant="destructive" className={className}>
      <IconAlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{errorMessage}</p>
          
          {showDetails && error instanceof Error && error.stack && (
            <details className="text-xs">
              <summary className="cursor-pointer">Show technical details</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded border overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="mt-3"
            >
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Network error component
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="text-center p-8">
      <IconWifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Connection Problem</h3>
      <p className="text-muted-foreground mb-4">
        Unable to connect to the server. Please check your internet connection.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <IconRefresh className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center p-8 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Animated loading state wrapper
 */
export interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LoadingWrapper({ 
  isLoading, 
  skeleton, 
  children, 
  className = '' 
}: LoadingWrapperProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {skeleton || <LoadingSkeleton />}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Query state wrapper that handles loading, error, and success states
 */
export interface QueryStateWrapperProps<T> {
  query: {
    data?: T;
    isLoading: boolean;
    isError: boolean;
    error?: Error | unknown;
    refetch?: () => void;
  };
  loadingSkeleton?: React.ReactNode;
  errorTitle?: string;
  emptyState?: EmptyStateProps;
  children: (data: T) => React.ReactNode;
  className?: string;
}

export function QueryStateWrapper<T>({ 
  query, 
  loadingSkeleton, 
  errorTitle,
  emptyState,
  children, 
  className = '' 
}: QueryStateWrapperProps<T>) {
  const { data, isLoading, isError, error, refetch } = query;
  
  if (isLoading) {
    return (
      <div className={className}>
        {loadingSkeleton || <LoadingSkeleton />}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className={className}>
        <ErrorDisplay 
          error={error} 
          onRetry={refetch}
          title={errorTitle}
        />
      </div>
    );
  }
  
  if (!data && emptyState) {
    return (
      <div className={className}>
        <EmptyState {...emptyState} />
      </div>
    );
  }
  
  if (!data) {
    return null;
  }
  
  return <div className={className}>{children(data)}</div>;
}

/**
 * Stale data indicator
 */
export function StaleDataIndicator({ 
  isStale, 
  lastUpdated 
}: { 
  isStale: boolean; 
  lastUpdated?: number;
}) {
  if (!isStale) return null;
  
  const timeAgo = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString()
    : 'Unknown';
  
  return (
    <div className="flex items-center space-x-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
      <IconAlertTriangle className="h-3 w-3" />
      <span>Data may be outdated (last updated: {timeAgo})</span>
    </div>
  );
}

/**
 * Refresh indicator for background updates
 */
export function RefreshIndicator({ isFetching }: { isFetching: boolean }) {
  if (!isFetching) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg">
        <IconLoader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Updating...</span>
      </div>
    </div>
  );
}
