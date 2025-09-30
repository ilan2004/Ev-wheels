'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  AccessibleButton,
  AccessibleCard,
  ScreenReaderOnly,
  LiveRegion,
  useKeyboardNavigation,
  AccessibleField,
  AccessibleTooltip,
  announceToScreenReader
} from './accessibility-helpers';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Battery,
  TrendingUp,
  Search,
  Filter,
  Bell,
  X,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';

// Accessible KPI Cards with proper ARIA labels and descriptions
interface AccessibleKPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  status?: 'normal' | 'warning' | 'critical';
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export function AccessibleKPICard({
  title,
  value,
  description,
  trend,
  status = 'normal',
  icon: Icon,
  onClick
}: AccessibleKPICardProps) {
  const statusColors = {
    normal: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    critical: 'border-red-200 bg-red-50'
  };

  const ariaLabel = `${title}: ${value}${trend ? `, ${trend.label}` : ''}${description ? `. ${description}` : ''}`;

  return (
    <AccessibleCard
      className={cn('p-6 transition-all hover:shadow-md', statusColors[status])}
      clickable={!!onClick}
      onClick={onClick}
      ariaLabel={ariaLabel}
      role='region'
    >
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <h3
            className='text-muted-foreground text-sm font-medium'
            id={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {title}
          </h3>
          <div className='flex items-baseline space-x-2'>
            <span
              className='text-2xl font-bold'
              aria-describedby={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'flex items-center text-xs',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}
                aria-label={`Trend: ${trend.label}`}
              >
                <TrendingUp className='mr-1 h-3 w-3' aria-hidden='true' />
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className='text-muted-foreground text-xs'>{description}</p>
          )}
        </div>
        {Icon && (
          <div className='flex-shrink-0'>
            <Icon
              className='text-muted-foreground h-8 w-8'
              aria-hidden='true'
            />
          </div>
        )}
      </div>
      <ScreenReaderOnly>
        {status !== 'normal' && `Status: ${status}`}
        {onClick && 'Press Enter or Space to view details'}
      </ScreenReaderOnly>
    </AccessibleCard>
  );
}

// Accessible Alert List with keyboard navigation
interface AccessibleAlertItemProps {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  onDismiss?: (id: string) => void;
  onView?: (id: string) => void;
}

function AccessibleAlertItem({
  id,
  title,
  description,
  severity,
  timestamp,
  onDismiss,
  onView
}: AccessibleAlertItemProps) {
  const severityConfig = {
    low: { color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
    critical: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <AccessibleCard
      className={cn('border-l-4 p-4', config.bg)}
      role='alert'
      ariaLabel={`${severity} severity alert: ${title}`}
    >
      <div className='flex items-start space-x-3'>
        <Icon
          className={cn('mt-0.5 h-5 w-5', config.color)}
          aria-hidden='true'
        />
        <div className='min-w-0 flex-1'>
          <h4 className='text-sm font-medium text-gray-900'>
            {title}
            <ScreenReaderOnly>, severity: {severity}</ScreenReaderOnly>
          </h4>
          <p className='mt-1 text-sm text-gray-600'>{description}</p>
          <time
            className='mt-1 block text-xs text-gray-500'
            dateTime={timestamp}
            aria-label={`Alert time: ${new Date(timestamp).toLocaleString()}`}
          >
            {new Date(timestamp).toLocaleString()}
          </time>
        </div>
        <div className='flex space-x-1'>
          {onView && (
            <AccessibleButton
              variant='outline'
              size='sm'
              onClick={() => onView(id)}
              aria-label={`View details for ${title}`}
            >
              View
            </AccessibleButton>
          )}
          {onDismiss && (
            <AccessibleButton
              variant='ghost'
              size='sm'
              onClick={() => onDismiss(id)}
              aria-label={`Dismiss ${title} alert`}
            >
              <X className='h-4 w-4' aria-hidden='true' />
            </AccessibleButton>
          )}
        </div>
      </div>
    </AccessibleCard>
  );
}

interface AccessibleAlertListProps {
  alerts: AccessibleAlertItemProps[];
  onFilterChange?: (severity: string | null) => void;
  selectedFilter?: string | null;
}

export function AccessibleAlertList({
  alerts,
  onFilterChange,
  selectedFilter
}: AccessibleAlertListProps) {
  const [announcement, setAnnouncement] = useState<string>('');

  const handleDismiss = (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      announceToScreenReader(`${alert.title} alert dismissed`, 'assertive');
    }
  };

  const handleFilterChange = (severity: string | null) => {
    onFilterChange?.(severity);
    const filterText = severity
      ? `filtered to ${severity} severity`
      : 'showing all alerts';
    announceToScreenReader(`Alerts ${filterText}`, 'polite');
  };

  return (
    <section
      className='space-y-4'
      aria-labelledby='alerts-heading'
      role='region'
    >
      <div className='flex items-center justify-between'>
        <h2 id='alerts-heading' className='text-lg font-semibold'>
          Active Alerts
          <span className='text-muted-foreground ml-2 text-sm font-normal'>
            ({alerts.length} total)
          </span>
        </h2>

        <div className='flex space-x-2'>
          <select
            value={selectedFilter || ''}
            onChange={(e) => handleFilterChange(e.target.value || null)}
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
            )}
            aria-label='Filter alerts by severity'
          >
            <option value=''>All Severities</option>
            <option value='critical'>Critical</option>
            <option value='high'>High</option>
            <option value='medium'>Medium</option>
            <option value='low'>Low</option>
          </select>
        </div>
      </div>

      <LiveRegion message={announcement} />

      {alerts.length === 0 ? (
        <AccessibleCard className='p-8 text-center'>
          <CheckCircle
            className='mx-auto mb-4 h-12 w-12 text-green-500'
            aria-hidden='true'
          />
          <h3 className='mb-2 text-lg font-medium text-gray-900'>All Clear!</h3>
          <p className='text-gray-600'>No active alerts at this time.</p>
        </AccessibleCard>
      ) : (
        <div
          className='space-y-3'
          role='list'
          aria-label={`${alerts.length} alerts`}
        >
          {alerts.map((alert) => (
            <div key={alert.id} role='listitem'>
              <AccessibleAlertItem {...alert} onDismiss={handleDismiss} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Accessible Search Component
interface AccessibleSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  results?: number;
}

export function AccessibleSearch({
  placeholder = 'Search...',
  onSearch,
  onClear,
  loading = false,
  results
}: AccessibleSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
    inputRef.current?.focus();
    announceToScreenReader('Search cleared', 'polite');
  };

  return (
    <form onSubmit={handleSubmit} role='search' className='relative'>
      <div
        className={cn(
          'relative flex items-center rounded-md border transition-all',
          isFocused ? 'ring-ring border-transparent ring-2' : 'border-input'
        )}
      >
        <Search
          className='text-muted-foreground ml-3 h-4 w-4'
          aria-hidden='true'
        />

        <input
          ref={inputRef}
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent px-3 py-2 text-sm',
            'placeholder:text-muted-foreground focus:outline-none'
          )}
          aria-label='Search'
          aria-describedby={
            results !== undefined ? 'search-results' : undefined
          }
        />

        {query && (
          <AccessibleButton
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleClear}
            className='mr-1'
            aria-label='Clear search'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </AccessibleButton>
        )}

        <AccessibleButton
          type='submit'
          variant='ghost'
          size='sm'
          loading={loading}
          loadingText='Searching...'
          className='mr-1'
          aria-label='Submit search'
        >
          <Search className='h-4 w-4' aria-hidden='true' />
        </AccessibleButton>
      </div>

      {results !== undefined && (
        <div
          id='search-results'
          className='text-muted-foreground mt-1 text-xs'
          aria-live='polite'
          aria-atomic='true'
        >
          {results === 0
            ? 'No results found'
            : `${results} result${results === 1 ? '' : 's'} found`}
        </div>
      )}
    </form>
  );
}

// Accessible Notification Center
interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  }>;
}

interface AccessibleNotificationCenterProps {
  notifications: NotificationProps[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
}

export function AccessibleNotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}: AccessibleNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className='relative'>
      <AccessibleButton
        ref={buttonRef}
        variant='outline'
        size='sm'
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup='true'
        className='relative'
      >
        <Bell className='h-4 w-4' aria-hidden='true' />
        {unreadCount > 0 && (
          <>
            <span
              className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white'
              aria-hidden='true'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <ScreenReaderOnly>, {unreadCount} unread</ScreenReaderOnly>
          </>
        )}
      </AccessibleButton>

      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'bg-background absolute right-0 z-50 mt-2 w-96 max-w-sm rounded-md border shadow-lg',
            'focus:outline-none'
          )}
          role='dialog'
          aria-label='Notifications'
          aria-modal='false'
        >
          <div className='border-b p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>Notifications</h3>
              <div className='flex space-x-2'>
                {unreadCount > 0 && onMarkAllAsRead && (
                  <AccessibleButton
                    variant='ghost'
                    size='sm'
                    onClick={onMarkAllAsRead}
                    aria-label='Mark all notifications as read'
                  >
                    Mark all read
                  </AccessibleButton>
                )}
                {onClearAll && (
                  <AccessibleButton
                    variant='ghost'
                    size='sm'
                    onClick={onClearAll}
                    aria-label='Clear all notifications'
                  >
                    Clear all
                  </AccessibleButton>
                )}
              </div>
            </div>
          </div>

          <div className='max-h-96 overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='text-muted-foreground p-8 text-center'>
                <Bell
                  className='mx-auto mb-4 h-12 w-12 opacity-50'
                  aria-hidden='true'
                />
                <p>No notifications</p>
              </div>
            ) : (
              <div className='divide-y'>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'hover:bg-accent/50 p-4',
                      !notification.read && 'bg-blue-50/50'
                    )}
                    role='article'
                    aria-labelledby={`notification-${notification.id}-title`}
                  >
                    <div className='flex items-start space-x-3'>
                      <div className='flex-1'>
                        <h4
                          id={`notification-${notification.id}-title`}
                          className={cn(
                            'text-sm font-medium',
                            !notification.read && 'font-semibold'
                          )}
                        >
                          {notification.title}
                          {!notification.read && (
                            <ScreenReaderOnly> (unread)</ScreenReaderOnly>
                          )}
                        </h4>
                        <p className='text-muted-foreground mt-1 text-sm'>
                          {notification.message}
                        </p>
                        <time className='text-muted-foreground text-xs'>
                          {new Date(notification.timestamp).toLocaleString()}
                        </time>

                        {notification.actions && (
                          <div className='mt-2 flex space-x-2'>
                            {notification.actions.map((action, index) => (
                              <AccessibleButton
                                key={index}
                                variant={action.variant || 'outline'}
                                size='sm'
                                onClick={action.onClick}
                              >
                                {action.label}
                              </AccessibleButton>
                            ))}
                          </div>
                        )}
                      </div>

                      {!notification.read && onMarkAsRead && (
                        <AccessibleButton
                          variant='ghost'
                          size='sm'
                          onClick={() => onMarkAsRead(notification.id)}
                          aria-label={`Mark ${notification.title} as read`}
                        >
                          <CheckCircle className='h-4 w-4' aria-hidden='true' />
                        </AccessibleButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
