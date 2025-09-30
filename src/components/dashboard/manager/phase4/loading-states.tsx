'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  IconRefresh,
  IconAlertTriangle,
  IconWifi,
  IconBulb,
  IconArrowLeft,
  IconHome
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Dashboard skeleton loader
export function DashboardSkeleton() {
  return (
    <div className='space-y-6 p-6'>
      {/* Header skeleton */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-96' />
          </div>
          <Skeleton className='h-6 w-6 rounded-full' />
        </div>

        {/* Quick actions skeleton */}
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-40' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-5 rounded' />
                  <div>
                    <Skeleton className='mb-1 h-4 w-20' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                </div>
                <Skeleton className='h-8 w-12' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert center skeleton */}
      <div className='space-y-4'>
        <div>
          <Skeleton className='mb-2 h-6 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div>
                      <Skeleton className='mb-1 h-4 w-24' />
                      <Skeleton className='h-3 w-32' />
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-6 w-8 rounded' />
                    <Skeleton className='h-4 w-4' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-32' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-20' />
          </div>
        </div>
        <Card className='animate-pulse'>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='border-border/50 flex items-center justify-between border-b py-3 last:border-0'
                >
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-4 w-64' />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-6 w-12 rounded' />
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-8 w-16' />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ticket list skeleton
export function TicketListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className='space-y-3'>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className='animate-pulse'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4' />
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-48' />
                  <Skeleton className='h-3 w-32' />
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-6 w-8 rounded' />
                <Skeleton className='h-3 w-12' />
                <Skeleton className='h-3 w-8' />
                <Skeleton className='h-8 w-16' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Card skeleton for various content
export function CardSkeleton({
  rows = 3,
  showHeader = true,
  className
}: {
  rows?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('animate-pulse', className)}>
      {showHeader && (
        <CardHeader>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48' />
        </CardHeader>
      )}
      <CardContent className='space-y-3'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='flex items-center gap-3'>
            <Skeleton className='h-4 w-4 rounded' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='ml-auto h-4 w-32' />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      <motion.div
        className={cn(
          'border-muted border-t-primary rounded-full border-2',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className='text-muted-foreground text-sm'>{text}</p>}
    </div>
  );
}

// Error states
interface ErrorStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'generic' | 'network' | 'notFound' | 'unauthorized';
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  type = 'generic',
  className
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <IconWifi className='text-muted-foreground/50 h-12 w-12' />;
      case 'notFound':
        return <IconBulb className='text-muted-foreground/50 h-12 w-12' />;
      case 'unauthorized':
        return <IconAlertTriangle className='text-destructive/50 h-12 w-12' />;
      default:
        return (
          <IconAlertTriangle className='text-muted-foreground/50 h-12 w-12' />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className='mb-4'>{getIcon()}</div>
      <h3 className='mb-2 text-lg font-semibold'>{title}</h3>
      <p className='text-muted-foreground mb-6 max-w-md'>{description}</p>
      {action && (
        <Button onClick={action.onClick} className='gap-2'>
          <IconRefresh className='h-4 w-4' />
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Network error with retry
export function NetworkErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      type='network'
      title='Connection Problem'
      description='Unable to load data. Please check your internet connection and try again.'
      action={{ label: 'Try Again', onClick: onRetry }}
    />
  );
}

// Not found error
export function NotFoundErrorState({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <ErrorState
      type='notFound'
      title='Nothing Found'
      description="We couldn't find what you're looking for. It might have been moved or deleted."
      action={onGoHome ? { label: 'Go Home', onClick: onGoHome } : undefined}
    />
  );
}

// Unauthorized error
export function UnauthorizedErrorState({ onLogin }: { onLogin?: () => void }) {
  return (
    <ErrorState
      type='unauthorized'
      title='Access Denied'
      description="You don't have permission to view this content. Please sign in or contact your administrator."
      action={onLogin ? { label: 'Sign In', onClick: onLogin } : undefined}
    />
  );
}

// Empty state component
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {icon && <div className='text-muted-foreground/50 mb-4'>{icon}</div>}
      <h3 className='mb-2 text-lg font-semibold'>{title}</h3>
      <p className='text-muted-foreground mb-6 max-w-md'>{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </motion.div>
  );
}

// Generic loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  text,
  children
}: LoadingOverlayProps) {
  return (
    <div className='relative'>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm'
        >
          <LoadingSpinner size='lg' text={text} />
        </motion.div>
      )}
    </div>
  );
}

// Progress indicator for multi-step processes
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  className
}: ProgressIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-sm font-medium'>
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className='text-muted-foreground text-sm'>
          {Math.round(((currentStep + 1) / steps.length) * 100)}%
        </span>
      </div>

      <div className='bg-muted mb-4 h-2 w-full rounded-full'>
        <motion.div
          className='bg-primary h-2 rounded-full'
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className='text-muted-foreground flex justify-between text-xs'>
        {steps.map((step, index) => (
          <span
            key={index}
            className={cn(
              'transition-colors',
              index <= currentStep && 'text-primary font-medium'
            )}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

// Retry boundary component
interface RetryBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error) => void;
}

export function RetryBoundary({
  children,
  fallback,
  onError
}: RetryBoundaryProps) {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount((count) => count + 1);
  }, []);

  const handleError = React.useCallback(
    (error: Error) => {
      setError(error);
      onError?.(error);
    },
    [onError]
  );

  if (error) {
    if (fallback) {
      return fallback(error, retry);
    }

    return (
      <ErrorState
        title='Something went wrong'
        description={
          error.message || 'An unexpected error occurred. Please try again.'
        }
        action={{ label: 'Try Again', onClick: retry }}
      />
    );
  }

  return (
    <React.Suspense fallback={<LoadingSpinner size='lg' text='Loading...' />}>
      <ErrorBoundary onError={handleError} key={retryCount}>
        {children}
      </ErrorBoundary>
    </React.Suspense>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Let the parent handle the error display
    }

    return this.props.children;
  }
}
