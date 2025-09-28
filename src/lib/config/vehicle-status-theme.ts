import type { VehicleStatus } from '@/lib/types/service-tickets';
import {
  Package,
  Search,
  Wrench,
  CheckCircle,
  Truck,
  PauseCircle,
  XCircle,
} from 'lucide-react';

export interface StatusTheme {
  id: VehicleStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    border: string;
    text: string;
    hover: {
      background: string;
      border: string;
    };
  };
  gradient: {
    from: string;
    via: string;
    to: string;
  };
  badge: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  };
}

export const vehicleStatusTheme: Record<VehicleStatus, StatusTheme> = {
  received: {
    id: 'received',
    title: 'Received',
    description: 'New vehicles awaiting diagnosis',
    icon: Package,
    colors: {
      primary: '#3b82f6', // blue-500
      secondary: '#93c5fd', // blue-300
      background: '#eff6ff', // blue-50
      border: '#bfdbfe', // blue-200
      text: '#1e40af', // blue-800
      hover: {
        background: '#dbeafe', // blue-100
        border: '#93c5fd', // blue-300
      },
    },
    gradient: {
      from: 'from-blue-50',
      via: 'via-blue-50/80',
      to: 'to-white',
    },
    badge: {
      variant: 'secondary',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  },
  diagnosed: {
    id: 'diagnosed',
    title: 'Diagnosed',
    description: 'Assessment completed, awaiting work',
    icon: Search,
    colors: {
      primary: '#a855f7', // purple-500
      secondary: '#c084fc', // purple-400
      background: '#faf5ff', // purple-50
      border: '#e9d5ff', // purple-200
      text: '#6b21a8', // purple-800
      hover: {
        background: '#f3e8ff', // purple-100
        border: '#c084fc', // purple-400
      },
    },
    gradient: {
      from: 'from-purple-50',
      via: 'via-purple-50/80',
      to: 'to-white',
    },
    badge: {
      variant: 'secondary',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
  },
  in_progress: {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Currently being worked on',
    icon: Wrench,
    colors: {
      primary: '#eab308', // yellow-500
      secondary: '#facc15', // yellow-400
      background: '#fefce8', // yellow-50
      border: '#fde68a', // yellow-300
      text: '#854d0e', // yellow-800
      hover: {
        background: '#fef3c7', // yellow-100
        border: '#fbbf24', // amber-400
      },
    },
    gradient: {
      from: 'from-amber-50',
      via: 'via-yellow-50/80',
      to: 'to-white',
    },
    badge: {
      variant: 'default',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
  },
  completed: {
    id: 'completed',
    title: 'Completed',
    description: 'Work finished, ready for delivery',
    icon: CheckCircle,
    colors: {
      primary: '#22c55e', // green-500
      secondary: '#4ade80', // green-400
      background: '#f0fdf4', // green-50
      border: '#86efac', // green-300
      text: '#166534', // green-800
      hover: {
        background: '#dcfce7', // green-100
        border: '#4ade80', // green-400
      },
    },
    gradient: {
      from: 'from-emerald-50',
      via: 'via-green-50/80',
      to: 'to-white',
    },
    badge: {
      variant: 'default',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
  },
  delivered: {
    id: 'delivered',
    title: 'Delivered',
    description: 'Vehicle returned to customer',
    icon: Truck,
    colors: {
      primary: '#6b7280', // gray-500
      secondary: '#9ca3af', // gray-400
      background: '#f9fafb', // gray-50
      border: '#d1d5db', // gray-300
      text: '#1f2937', // gray-800
      hover: {
        background: '#f3f4f6', // gray-100
        border: '#9ca3af', // gray-400
      },
    },
    gradient: {
      from: 'from-gray-50',
      via: 'via-gray-50/80',
      to: 'to-white',
    },
    badge: {
      variant: 'secondary',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    },
  },
  on_hold: {
    id: 'on_hold',
    title: 'On Hold',
    description: 'Awaiting parts or customer response',
    icon: PauseCircle,
    colors: {
      primary: '#ef4444', // red-500
      secondary: '#f87171', // red-400
      background: '#fef2f2', // red-50
      border: '#fecaca', // red-300
      text: '#991b1b', // red-800
      hover: {
        background: '#fee2e2', // red-100
        border: '#f87171', // red-400
      },
    },
    gradient: {
      from: 'from-red-50',
      via: 'via-orange-50/80',
      to: 'to-white',
    },
    badge: {
      variant: 'destructive',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  },
  cancelled: {
    id: 'cancelled',
    title: 'Cancelled',
    description: 'Service cancelled by customer',
    icon: XCircle,
    colors: {
      primary: '#374151', // gray-700
      secondary: '#4b5563', // gray-600
      background: '#f3f4f6', // gray-100
      border: '#9ca3af', // gray-400
      text: '#111827', // gray-900
      hover: {
        background: '#e5e7eb', // gray-200
        border: '#6b7280', // gray-500
      },
    },
    gradient: {
      from: 'from-gray-100',
      via: 'via-gray-200/50',
      to: 'to-white',
    },
    badge: {
      variant: 'outline',
      className: 'bg-gray-50 text-gray-500 border-gray-300',
    },
  },
};

export const priorityTheme = {
  low: {
    color: 'text-green-600 bg-green-100',
    borderColor: 'border-green-200',
    indicatorColor: 'bg-green-500',
  },
  medium: {
    color: 'text-yellow-600 bg-yellow-100',
    borderColor: 'border-yellow-200',
    indicatorColor: 'bg-yellow-500',
  },
  high: {
    color: 'text-orange-600 bg-orange-100',
    borderColor: 'border-orange-200',
    indicatorColor: 'bg-orange-500',
  },
  critical: {
    color: 'text-red-600 bg-red-100',
    borderColor: 'border-red-200',
    indicatorColor: 'bg-red-500',
    animation: 'animate-pulse',
  },
};

export function getStatusTheme(status: VehicleStatus): StatusTheme {
  return vehicleStatusTheme[status] || vehicleStatusTheme.received;
}

export function getPriorityClass(days: number): keyof typeof priorityTheme {
  if (days > 10) return 'critical';
  if (days > 7) return 'high';
  if (days > 3) return 'medium';
  return 'low';
}
