import { useMemo } from 'react';
import { cn } from '@/lib/utils';

// Pre-computed style objects for better performance
export const SIDEBAR_STYLE_PRESETS = {
  // Active state styles (pre-computed to avoid runtime calculations)
  active: {
    core: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-l-blue-200 dark:border-l-blue-800',
      className: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-l-2 border-l-blue-200 dark:border-l-blue-800'
    },
    workflow: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      color: 'text-green-600 dark:text-green-400',
      border: 'border-l-green-200 dark:border-l-green-800',
      className: 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-l-2 border-l-green-200 dark:border-l-green-800'
    },
    business: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      color: 'text-purple-600 dark:text-purple-400',
      border: 'border-l-purple-200 dark:border-l-purple-800',
      className: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-l-2 border-l-purple-200 dark:border-l-purple-800'
    },
    insights: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      color: 'text-orange-600 dark:text-orange-400',
      border: 'border-l-orange-200 dark:border-l-orange-800',
      className: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-l-2 border-l-orange-200 dark:border-l-orange-800'
    },
    admin: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      color: 'text-red-600 dark:text-red-400',
      border: 'border-l-red-200 dark:border-l-red-800',
      className: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-l-2 border-l-red-200 dark:border-l-red-800'
    },
    personal: {
      bg: 'bg-gray-50 dark:bg-gray-950/20',
      color: 'text-gray-600 dark:text-gray-400',
      border: 'border-l-gray-200 dark:border-l-gray-800',
      className: 'bg-gray-50 dark:bg-gray-950/20 text-gray-600 dark:text-gray-400 border-l-2 border-l-gray-200 dark:border-l-gray-800'
    }
  },
  
  // Inactive state styles
  inactive: {
    className: 'text-sidebar-foreground/70',
    iconColor: 'text-sidebar-foreground/70',
    textColor: 'text-sidebar-foreground'
  },
  
  // Common classes
  hover: 'hover:bg-sidebar-accent/50',
  transition: 'group relative transition-all duration-200',
  
  // Role-specific badge styles
  roleBadges: {
    admin: 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950/20',
    manager: 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/20',
    technician: 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950/20',
    default: 'border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950/20'
  }
} as const;

// Optimized style getter functions
export const getMenuItemClassName = (
  isActive: boolean, 
  categoryKey: string
): string => {
  const baseClasses = SIDEBAR_STYLE_PRESETS.transition + ' ' + SIDEBAR_STYLE_PRESETS.hover;
  
  if (!isActive) {
    return cn(baseClasses, SIDEBAR_STYLE_PRESETS.inactive.className);
  }
  
  const activeStyle = SIDEBAR_STYLE_PRESETS.active[categoryKey as keyof typeof SIDEBAR_STYLE_PRESETS.active];
  return cn(baseClasses, activeStyle?.className || SIDEBAR_STYLE_PRESETS.active.personal.className);
};

export const getIconClassName = (
  isActive: boolean, 
  categoryKey: string
): string => {
  const baseClasses = 'transition-colors';
  
  if (!isActive) {
    return cn(baseClasses, SIDEBAR_STYLE_PRESETS.inactive.iconColor);
  }
  
  const activeStyle = SIDEBAR_STYLE_PRESETS.active[categoryKey as keyof typeof SIDEBAR_STYLE_PRESETS.active];
  return cn(baseClasses, activeStyle?.color || SIDEBAR_STYLE_PRESETS.active.personal.color);
};

export const getTextClassName = (
  isActive: boolean, 
  categoryKey: string
): string => {
  const baseClasses = 'font-medium transition-colors';
  
  if (!isActive) {
    return cn(baseClasses, SIDEBAR_STYLE_PRESETS.inactive.textColor);
  }
  
  const activeStyle = SIDEBAR_STYLE_PRESETS.active[categoryKey as keyof typeof SIDEBAR_STYLE_PRESETS.active];
  return cn(baseClasses, activeStyle?.color || SIDEBAR_STYLE_PRESETS.active.personal.color);
};

export const getRoleBadgeClassName = (role: string): string => {
  const baseClasses = 'text-xs font-medium';
  const roleClass = SIDEBAR_STYLE_PRESETS.roleBadges[role as keyof typeof SIDEBAR_STYLE_PRESETS.roleBadges];
  return cn(baseClasses, roleClass || SIDEBAR_STYLE_PRESETS.roleBadges.default);
};

// Status configuration (moved to separate object for better performance)
export const STATUS_CONFIG = {
  'Tickets': { count: 12, urgent: 3, color: 'bg-red-500' },
  'Batteries': { count: 8, urgent: 1, color: 'bg-amber-500' },
  'Inventory': { count: 5, urgent: 2, color: 'bg-blue-500' },
  'Quotes': { count: 7, urgent: 0, color: 'bg-green-500' }
} as const;

// Optimized status getter (memoizable)
export const getOptimizedItemStatus = (title: string) => {
  return STATUS_CONFIG[title as keyof typeof STATUS_CONFIG] || null;
};

// Badge style helpers
export const getStatusBadgeClassName = (hasUrgent: boolean): string => {
  const baseClasses = 'text-xs px-1.5 py-0.5 h-5 min-w-5 flex items-center justify-center';
  
  if (hasUrgent) {
    return cn(baseClasses, 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-300');
  }
  
  return cn(baseClasses, 'bg-sidebar-accent text-sidebar-accent-foreground');
};

// Category dot color helper
export const getCategoryDotClassName = (categoryColor: string): string => {
  // Extract the color from the text class and convert to background class
  const colorMatch = categoryColor.match(/text-(\w+)-(\d+)/);
  if (colorMatch) {
    const [, color, shade] = colorMatch;
    return `w-2 h-2 rounded-full bg-${color}-${shade} dark:bg-${color}-400`;
  }
  return 'w-2 h-2 rounded-full bg-gray-500';
};

// Pre-compute category styles for maximum performance
export const useCategoryStyles = (categories: Record<string, any>) => {
  return useMemo(() => {
    const styles: Record<string, any> = {};
    
    Object.entries(categories).forEach(([key, config]) => {
      styles[key] = {
        labelClassName: cn('text-xs font-semibold tracking-wider uppercase mb-2 px-2', config.color),
        dotClassName: getCategoryDotClassName(config.color),
        subMenuClassName: cn('ml-6 pl-4 border-l-2 border-dashed', config.accentColor)
      };
    });
    
    return styles;
  }, [categories]);
};
