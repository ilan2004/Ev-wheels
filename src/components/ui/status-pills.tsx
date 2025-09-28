'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Type definitions for ticket statuses
export type TicketStatus = 
  | 'reported' 
  | 'triaged' 
  | 'assigned' 
  | 'in_progress' 
  | 'waiting_approval'
  | 'completed' 
  | 'delivered' 
  | 'closed' 
  | 'cancelled' 
  | 'on_hold';

export type PriorityLevel = 1 | 2 | 3;

// Status pill configurations with proper dark mode support
const STATUS_CONFIGS: Record<TicketStatus, {
  label: string;
  className: string;
  dot: string;
}> = {
  reported: {
    label: 'Reported',
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    dot: 'bg-slate-400 dark:bg-slate-500'
  },
  triaged: {
    label: 'Triaged', 
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-600',
    dot: 'bg-indigo-500 dark:bg-indigo-400'
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600',
    dot: 'bg-blue-500 dark:bg-blue-400'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600',
    dot: 'bg-amber-500 dark:bg-amber-400'
  },
  waiting_approval: {
    label: 'Waiting Approval',
    className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600',
    dot: 'bg-purple-500 dark:bg-purple-400'
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600',
    dot: 'bg-emerald-500 dark:bg-emerald-400'
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-600',
    dot: 'bg-teal-500 dark:bg-teal-400'
  },
  closed: {
    label: 'Closed',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600',
    dot: 'bg-green-500 dark:bg-green-400'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600',
    dot: 'bg-red-500 dark:bg-red-400'
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    dot: 'bg-gray-500 dark:bg-gray-400'
  }
};

const PRIORITY_CONFIGS: Record<PriorityLevel, {
  label: string;
  className: string;
  dot: string;
}> = {
  1: {
    label: 'P1',
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600',
    dot: 'bg-red-500 dark:bg-red-400'
  },
  2: {
    label: 'P2', 
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600',
    dot: 'bg-amber-500 dark:bg-amber-400'
  },
  3: {
    label: 'P3',
    className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    dot: 'bg-gray-500 dark:bg-gray-400'
  }
};

// Main Status Pill Component
interface StatusPillProps {
  status: TicketStatus;
  variant?: 'default' | 'compact' | 'dot';
  className?: string;
}

export function StatusPill({ 
  status, 
  variant = 'default',
  className 
}: StatusPillProps) {
  const config = STATUS_CONFIGS[status];
  
  if (!config) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        'bg-muted text-muted-foreground border',
        className
      )}>
        {status}
      </span>
    );
  }

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
        <span className={cn('flex h-2 w-2 rounded-full', config.dot)} />
        {config.label}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border',
        config.className,
        className
      )}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}

// Priority Pill Component
interface PriorityPillProps {
  priority: PriorityLevel | null;
  variant?: 'default' | 'compact' | 'dot';
  className?: string;
}

export function PriorityPill({
  priority,
  variant = 'default',
  className
}: PriorityPillProps) {
  if (!priority || ![1, 2, 3].includes(priority)) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        'bg-muted text-muted-foreground border-transparent',
        className
      )}>
        —
      </span>
    );
  }

  const config = PRIORITY_CONFIGS[priority];

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
        <span className={cn('flex h-2 w-2 rounded-full', config.dot)} />
        {config.label}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border',
        config.className,
        className
      )}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}

// Combined Status + Priority Component
interface CombinedStatusProps {
  status: TicketStatus;
  priority?: PriorityLevel | null;
  variant?: 'default' | 'compact' | 'dot';
  className?: string;
  showPriority?: boolean;
}

export function CombinedStatus({
  status,
  priority,
  variant = 'default',
  className,
  showPriority = true
}: CombinedStatusProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <StatusPill status={status} variant={variant} />
      {showPriority && priority && (
        <PriorityPill priority={priority} variant={variant} />
      )}
    </div>
  );
}

// Status Timeline Component (for activity/history views)
interface StatusTimelineItemProps {
  status: TicketStatus;
  timestamp: string;
  note?: string;
  isActive?: boolean;
  className?: string;
}

export function StatusTimelineItem({
  status,
  timestamp,
  note,
  isActive = false,
  className
}: StatusTimelineItemProps) {
  const config = STATUS_CONFIGS[status];
  
  return (
    <div className={cn(
      'flex items-start gap-3 py-3',
      isActive && 'bg-muted/50 rounded-lg px-3',
      className
    )}>
      <div className="relative flex h-6 w-6 items-center justify-center">
        <span className={cn(
          'h-3 w-3 rounded-full border-2 border-background',
          config.dot,
          isActive && 'ring-2 ring-current ring-opacity-20'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <StatusPill status={status} variant="compact" />
          <span className="text-muted-foreground text-xs">
            {new Date(timestamp).toLocaleString()}
          </span>
        </div>
        {note && (
          <p className="text-sm text-muted-foreground mt-1">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

// Status Filter Component (for dropdowns/selects)
interface StatusFilterProps {
  value: TicketStatus | 'all';
  onChange: (status: TicketStatus | 'all') => void;
  className?: string;
  placeholder?: string;
}

export function StatusFilter({
  value,
  onChange,
  className,
  placeholder = "Filter by status"
}: StatusFilterProps) {
  const statuses: (TicketStatus | 'all')[] = [
    'all',
    ...Object.keys(STATUS_CONFIGS) as TicketStatus[]
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TicketStatus | 'all')}
      className={cn(
        'inline-flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
        'ring-offset-background placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <option value="all">All Statuses</option>
      {Object.entries(STATUS_CONFIGS).map(([status, config]) => (
        <option key={status} value={status}>
          {config.label}
        </option>
      ))}
    </select>
  );
}

// Utility functions
export function getStatusConfig(status: TicketStatus) {
  return STATUS_CONFIGS[status];
}

export function getPriorityConfig(priority: PriorityLevel) {
  return PRIORITY_CONFIGS[priority];
}

export function isHighPriority(priority: PriorityLevel | null): boolean {
  return priority === 1;
}

export function isUrgentStatus(status: TicketStatus): boolean {
  return ['reported', 'in_progress', 'waiting_approval'].includes(status);
}

// Status group helpers
export const STATUS_GROUPS = {
  active: ['reported', 'triaged', 'assigned', 'in_progress', 'waiting_approval'] as TicketStatus[],
  completed: ['completed', 'delivered', 'closed'] as TicketStatus[],
  inactive: ['cancelled', 'on_hold'] as TicketStatus[]
} as const;

export function getStatusGroup(status: TicketStatus): keyof typeof STATUS_GROUPS | 'unknown' {
  for (const [group, statuses] of Object.entries(STATUS_GROUPS)) {
    if (statuses.includes(status)) {
      return group as keyof typeof STATUS_GROUPS;
    }
  }
  return 'unknown';
}
