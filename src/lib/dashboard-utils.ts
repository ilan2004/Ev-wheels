'use client';

import { cn } from '@/lib/utils';

// Status types for consistent theming across dashboard
export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'up' | 'down' | 'neutral';

// Color mappings for different status types
export const statusColors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
    accent: 'bg-green-100 dark:bg-green-900/50'
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400',
    accent: 'bg-orange-100 dark:bg-orange-900/50'
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
    accent: 'bg-red-100 dark:bg-red-900/50'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-100 dark:bg-blue-900/50'
  },
  neutral: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-600 dark:text-gray-400',
    accent: 'bg-gray-100 dark:bg-gray-900/50'
  },
  pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'text-yellow-600 dark:text-yellow-400',
    accent: 'bg-yellow-100 dark:bg-yellow-900/50'
  }
} as const;

// Priority level styling
export const priorityColors = {
  low: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  },
  medium: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300'
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
  }
} as const;

// Utility functions for getting status-based classes
export const getStatusClasses = (status: StatusType) => {
  return statusColors[status];
};

export const getPriorityClasses = (priority: Priority) => {
  return priorityColors[priority];
};

export const getTrendColor = (trend: TrendDirection) => {
  switch (trend) {
    case 'up': return 'text-green-600 dark:text-green-400';
    case 'down': return 'text-red-600 dark:text-red-400';
    case 'neutral': return 'text-muted-foreground';
  }
};

export const getTrendIcon = (trend: TrendDirection) => {
  switch (trend) {
    case 'up': return '↗️';
    case 'down': return '↘️';
    case 'neutral': return '→';
  }
};

// Battery status specific utilities
export type BatteryStatus = 'pending' | 'in_progress' | 'testing' | 'completed' | 'delivered' | 'cancelled';

export const getBatteryStatusInfo = (status: BatteryStatus) => {
  const statusMap = {
    pending: {
      label: 'Pending',
      status: 'pending' as StatusType,
      priority: 'medium' as Priority,
      description: 'Awaiting assessment'
    },
    in_progress: {
      label: 'In Progress',
      status: 'info' as StatusType,
      priority: 'high' as Priority,
      description: 'Currently being repaired'
    },
    testing: {
      label: 'Testing',
      status: 'warning' as StatusType,
      priority: 'medium' as Priority,
      description: 'Quality testing in progress'
    },
    completed: {
      label: 'Completed',
      status: 'success' as StatusType,
      priority: 'low' as Priority,
      description: 'Ready for delivery'
    },
    delivered: {
      label: 'Delivered',
      status: 'success' as StatusType,
      priority: 'low' as Priority,
      description: 'Successfully delivered'
    },
    cancelled: {
      label: 'Cancelled',
      status: 'neutral' as StatusType,
      priority: 'low' as Priority,
      description: 'Repair cancelled'
    }
  };

  return statusMap[status] || statusMap.pending;
};

// Dashboard section identifiers for consistent styling
export type DashboardSection = 
  | 'overview' 
  | 'quick_actions' 
  | 'alerts' 
  | 'progress' 
  | 'recent_activity' 
  | 'management';

export const getDashboardSectionConfig = (section: DashboardSection) => {
  const configs = {
    overview: {
      icon: '📊',
      title: 'Overview',
      variant: 'elevated' as const,
      priority: 1
    },
    quick_actions: {
      icon: '⚡',
      title: 'Quick Actions',
      variant: 'default' as const,
      priority: 2
    },
    alerts: {
      icon: '🚨',
      title: 'Alerts',
      variant: 'warning' as const,
      priority: 3
    },
    progress: {
      icon: '📈',
      title: 'Progress',
      variant: 'info' as const,
      priority: 4
    },
    recent_activity: {
      icon: '📋',
      title: 'Recent Activity',
      variant: 'default' as const,
      priority: 5
    },
    management: {
      icon: '⚙️',
      title: 'Management',
      variant: 'default' as const,
      priority: 6
    }
  };

  return configs[section];
};

// Utility for creating consistent spacing and layout
export const getLayoutClasses = (type: 'section' | 'card_grid' | 'content') => {
  const layouts = {
    section: 'space-y-6',
    card_grid: 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    content: 'p-6 space-y-6'
  };

  return layouts[type];
};

// Animation utilities for consistent motion
export const getAnimationConfig = (type: 'fadeIn' | 'slideUp' | 'stagger') => {
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    },
    stagger: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, delay: 0.1 }
    }
  };

  return animations[type];
};

// Responsive design utilities
export const getResponsiveClasses = (
  mobile: string,
  tablet?: string,
  desktop?: string
) => {
  return cn(
    mobile,
    tablet && `md:${tablet}`,
    desktop && `lg:${desktop}`
  );
};

// Helper function to format numbers for display
export const formatMetricValue = (value: number, type: 'currency' | 'number' | 'percentage') => {
  switch (type) {
    case 'currency':
      return `₹${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    case 'number':
    default:
      return value.toLocaleString();
  }
};

// Helper function to format dates for dashboard
export const formatDashboardDate = (date: Date | string, format: 'relative' | 'short' | 'long' = 'relative') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));

  if (format === 'relative') {
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};
