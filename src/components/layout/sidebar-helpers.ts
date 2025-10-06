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
      className:
        'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-l-2 border-l-blue-200 dark:border-l-blue-800'
    },
    workflow: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      color: 'text-green-600 dark:text-green-400',
      border: 'border-l-green-200 dark:border-l-green-800',
      className:
        'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-l-2 border-l-green-200 dark:border-l-green-800'
    },
    business: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      color: 'text-purple-600 dark:text-purple-400',
      border: 'border-l-purple-200 dark:border-l-purple-800',
      className:
        'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-l-2 border-l-purple-200 dark:border-l-purple-800'
    },
    insights: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      color: 'text-orange-600 dark:text-orange-400',
      border: 'border-l-orange-200 dark:border-l-orange-800',
      className:
        'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-l-2 border-l-orange-200 dark:border-l-orange-800'
    },
    admin: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      color: 'text-red-600 dark:text-red-400',
      border: 'border-l-red-200 dark:border-l-red-800',
      className:
        'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-l-2 border-l-red-200 dark:border-l-red-800'
    },
    personal: {
      bg: 'bg-gray-50 dark:bg-gray-950/20',
      color: 'text-gray-600 dark:text-gray-400',
      border: 'border-l-gray-200 dark:border-l-gray-800',
      className:
        'bg-gray-50 dark:bg-gray-950/20 text-gray-600 dark:text-gray-400 border-l-2 border-l-gray-200 dark:border-l-gray-800'
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
    admin:
      'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950/20',
    manager:
      'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/20',
    technician:
      'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950/20',
    default:
      'border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950/20'
  }
} as const;

// Optimized style getter functions
export const getMenuItemClassName = (
  isActive: boolean,
  categoryKey: string
): string => {
  const baseClasses =
    SIDEBAR_STYLE_PRESETS.transition + ' ' + SIDEBAR_STYLE_PRESETS.hover;

  if (!isActive) {
    return cn(baseClasses, SIDEBAR_STYLE_PRESETS.inactive.className);
  }

  const activeStyle =
    SIDEBAR_STYLE_PRESETS.active[
      categoryKey as keyof typeof SIDEBAR_STYLE_PRESETS.active
    ];
  return cn(
    baseClasses,
    activeStyle?.className || SIDEBAR_STYLE_PRESETS.active.personal.className
  );
};

export const getIconClassName = (
  isActive: boolean,
  categoryKey: string
): string => {
  const baseClasses = 'transition-colors';

  if (!isActive) {
    return cn(baseClasses, SIDEBAR_STYLE_PRESETS.inactive.iconColor);
  }

  const activeStyle =
    SIDEBAR_STYLE_PRESETS.active[
      categoryKey as keyof typeof SIDEBAR_STYLE_PRESETS.active
    ];
  return cn(
    baseClasses,
    activeStyle?.color || SIDEBAR_STYLE_PRESETS.active.personal.color
  );
};

export const getTextClassName = (
  isActive: boolean,
  categoryKey: string
): string => {
  const baseClasses = 'font-medium transition-colors';

  if (!isActive) {
    return cn(baseClasses, SIDEBAR_STYLE_PRESETS.inactive.textColor);
  }

  const activeStyle =
    SIDEBAR_STYLE_PRESETS.active[
      categoryKey as keyof typeof SIDEBAR_STYLE_PRESETS.active
    ];
  return cn(
    baseClasses,
    activeStyle?.color || SIDEBAR_STYLE_PRESETS.active.personal.color
  );
};

export const getRoleBadgeClassName = (role: string): string => {
  const baseClasses = 'text-xs font-medium';
  const roleClass =
    SIDEBAR_STYLE_PRESETS.roleBadges[
      role as keyof typeof SIDEBAR_STYLE_PRESETS.roleBadges
    ];
  return cn(baseClasses, roleClass || SIDEBAR_STYLE_PRESETS.roleBadges.default);
};

// Live status configuration - now uses dynamic data
export interface StatusInfo {
  count: number;
  urgent: number;
  color: string;
}

// Status colors mapping
const STATUS_COLORS = {
  'Job Cards': 'bg-red-500',
  'Batteries': 'bg-amber-500', 
  'Inventory': 'bg-blue-500',
  'Quotes': 'bg-green-500',
  'Vehicles': 'bg-purple-500',
  'Customers': 'bg-teal-500'
} as const;

// Function to get live status - will be replaced with hook data in components
export const getOptimizedItemStatus = (title: string, liveData?: any): StatusInfo | null => {
  if (!liveData) {
    // Fallback to static data if live data not available
    const fallback = {
      'Job Cards': { count: 0, urgent: 0 },
      'Batteries': { count: 0, urgent: 0 },
      'Inventory': { count: 0, urgent: 0 },
      'Quotes': { count: 0, urgent: 0 },
      'Vehicles': { count: 0, urgent: 0 },
      'Customers': { count: 0, urgent: 0 }
    };
    
    const data = fallback[title as keyof typeof fallback];
    if (!data) return null;
    
    return {
      ...data,
      color: STATUS_COLORS[title as keyof typeof STATUS_COLORS] || 'bg-gray-500'
    };
  }
  
  // Use live data when available
  let statusData: { count: number; urgent: number } | null = null;
  
  switch (title) {
    case 'Job Cards':
      statusData = liveData.jobCards ? {
        count: liveData.jobCards.total || 0,
        urgent: liveData.jobCards.urgent || 0
      } : null;
      break;
    case 'Batteries':
      statusData = liveData.batteries ? {
        count: liveData.batteries.total || 0,
        urgent: liveData.batteries.urgent || 0
      } : null;
      break;
    case 'Inventory':
      statusData = liveData.inventory ? {
        count: liveData.inventory.total || 0,
        urgent: liveData.inventory.alerts || 0
      } : null;
      break;
    case 'Quotes':
      statusData = liveData.quotes ? {
        count: liveData.quotes.total || 0,
        urgent: liveData.quotes.expiringSoon || 0
      } : null;
      break;
    case 'Vehicles':
      statusData = liveData.vehicles ? {
        count: liveData.vehicles.total || 0,
        urgent: liveData.vehicles.overdue || 0
      } : null;
      break;
    case 'Customers':
      statusData = liveData.customers ? {
        count: liveData.customers.total || 0,
        urgent: 0 // Customers don't typically have urgent status
      } : null;
      break;
  }
  
  if (!statusData) return null;
  
  return {
    ...statusData,
    color: STATUS_COLORS[title as keyof typeof STATUS_COLORS] || 'bg-gray-500'
  };
};

// Badge style helpers
export const getStatusBadgeClassName = (hasUrgent: boolean): string => {
  const baseClasses =
    'text-xs px-1.5 py-0.5 h-5 min-w-5 flex items-center justify-center';

  if (hasUrgent) {
    return cn(
      baseClasses,
      'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-300'
    );
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
        labelClassName: cn(
          'text-xs font-semibold tracking-wider uppercase mb-2 px-2',
          config.color
        ),
        dotClassName: getCategoryDotClassName(config.color),
        subMenuClassName: cn(
          'ml-6 pl-4 border-l-2 border-dashed',
          config.accentColor
        )
      };
    });

    return styles;
  }, [categories]);
};
