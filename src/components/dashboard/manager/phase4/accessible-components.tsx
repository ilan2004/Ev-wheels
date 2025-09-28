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
      role="region"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground" id={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold" aria-describedby={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </span>
            {trend && (
              <span className={cn(
                'text-xs flex items-center',
                trend.value >= 0 ? 'text-green-600' : 'text-red-600'
              )} aria-label={`Trend: ${trend.label}`}>
                <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
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
      className={cn('p-4 border-l-4', config.bg)}
      role="alert"
      ariaLabel={`${severity} severity alert: ${title}`}
    >
      <div className="flex items-start space-x-3">
        <Icon 
          className={cn('h-5 w-5 mt-0.5', config.color)} 
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {title}
            <ScreenReaderOnly>, severity: {severity}</ScreenReaderOnly>
          </h4>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          <time 
            className="mt-1 text-xs text-gray-500 block" 
            dateTime={timestamp}
            aria-label={`Alert time: ${new Date(timestamp).toLocaleString()}`}
          >
            {new Date(timestamp).toLocaleString()}
          </time>
        </div>
        <div className="flex space-x-1">
          {onView && (
            <AccessibleButton
              variant="outline"
              size="sm"
              onClick={() => onView(id)}
              aria-label={`View details for ${title}`}
            >
              View
            </AccessibleButton>
          )}
          {onDismiss && (
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(id)}
              aria-label={`Dismiss ${title} alert`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
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
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      announceToScreenReader(`${alert.title} alert dismissed`, 'assertive');
    }
  };

  const handleFilterChange = (severity: string | null) => {
    onFilterChange?.(severity);
    const filterText = severity ? `filtered to ${severity} severity` : 'showing all alerts';
    announceToScreenReader(`Alerts ${filterText}`, 'polite');
  };

  return (
    <section 
      className="space-y-4" 
      aria-labelledby="alerts-heading"
      role="region"
    >
      <div className="flex items-center justify-between">
        <h2 id="alerts-heading" className="text-lg font-semibold">
          Active Alerts
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({alerts.length} total)
          </span>
        </h2>
        
        <div className="flex space-x-2">
          <select
            value={selectedFilter || ''}
            onChange={(e) => handleFilterChange(e.target.value || null)}
            className={cn(
              'px-3 py-2 text-sm border rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
            )}
            aria-label="Filter alerts by severity"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <LiveRegion message={announcement} />

      {alerts.length === 0 ? (
        <AccessibleCard className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No active alerts at this time.</p>
        </AccessibleCard>
      ) : (
        <div 
          className="space-y-3" 
          role="list" 
          aria-label={`${alerts.length} alerts`}
        >
          {alerts.map((alert) => (
            <div key={alert.id} role="listitem">
              <AccessibleAlertItem
                {...alert}
                onDismiss={handleDismiss}
              />
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
  placeholder = "Search...",
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
    <form onSubmit={handleSubmit} role="search" className="relative">
      <div className={cn(
        'relative flex items-center border rounded-md transition-all',
        isFocused ? 'ring-2 ring-ring border-transparent' : 'border-input'
      )}>
        <Search className="h-4 w-4 text-muted-foreground ml-3" aria-hidden="true" />
        
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'flex-1 px-3 py-2 bg-transparent text-sm',
            'focus:outline-none placeholder:text-muted-foreground'
          )}
          aria-label="Search"
          aria-describedby={results !== undefined ? 'search-results' : undefined}
        />

        {query && (
          <AccessibleButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="mr-1"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </AccessibleButton>
        )}

        <AccessibleButton
          type="submit"
          variant="ghost"
          size="sm"
          loading={loading}
          loadingText="Searching..."
          className="mr-1"
          aria-label="Submit search"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </AccessibleButton>
      </div>

      {results !== undefined && (
        <div 
          id="search-results" 
          className="text-xs text-muted-foreground mt-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {results === 0 ? 'No results found' : `${results} result${results === 1 ? '' : 's'} found`}
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
  const unreadCount = notifications.filter(n => !n.read).length;
  
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
    <div className="relative">
      <AccessibleButton
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <>
            <span 
              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              aria-hidden="true"
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
            'absolute right-0 mt-2 w-96 max-w-sm bg-background border rounded-md shadow-lg z-50',
            'focus:outline-none'
          )}
          role="dialog"
          aria-label="Notifications"
          aria-modal="false"
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && onMarkAllAsRead && (
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    aria-label="Mark all notifications as read"
                  >
                    Mark all read
                  </AccessibleButton>
                )}
                {onClearAll && (
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    aria-label="Clear all notifications"
                  >
                    Clear all
                  </AccessibleButton>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-accent/50',
                      !notification.read && 'bg-blue-50/50'
                    )}
                    role="article"
                    aria-labelledby={`notification-${notification.id}-title`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h4 
                          id={`notification-${notification.id}-title`}
                          className={cn(
                            'text-sm font-medium',
                            !notification.read && 'font-semibold'
                          )}
                        >
                          {notification.title}
                          {!notification.read && <ScreenReaderOnly> (unread)</ScreenReaderOnly>}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <time className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </time>
                        
                        {notification.actions && (
                          <div className="flex space-x-2 mt-2">
                            {notification.actions.map((action, index) => (
                              <AccessibleButton
                                key={index}
                                variant={action.variant || 'outline'}
                                size="sm"
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
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsRead(notification.id)}
                          aria-label={`Mark ${notification.title} as read`}
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
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
