import type {
  ServiceTicketStatus,
  VehicleStatus,
  BatteryStatus,
  CaseStatus,
  StatusInfo
} from '@/lib/types/service-tickets';

/**
 * Get status information including color classes and labels
 */
export function getStatusInfo(
  status: CaseStatus | ServiceTicketStatus
): StatusInfo {
  const statusMap: Record<string, StatusInfo> = {
    // Service ticket statuses
    reported: {
      label: 'Reported',
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800'
    },
    triaged: {
      label: 'Triaged',
      color: 'purple',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-800'
    },
    in_progress: {
      label: 'In Progress',
      color: 'yellow',
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-800'
    },
    completed: {
      label: 'Completed',
      color: 'green',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800'
    },
    delivered: {
      label: 'Delivered',
      color: 'green',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800'
    },
    closed: {
      label: 'Closed',
      color: 'gray',
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-800'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'red',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800'
    },
    on_hold: {
      label: 'On Hold',
      color: 'yellow',
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-800'
    },
    waiting_approval: {
      label: 'Waiting Approval',
      color: 'purple',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-800'
    },
    // Vehicle/Battery case statuses
    received: {
      label: 'Received',
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800'
    },
    diagnosed: {
      label: 'Diagnosed',
      color: 'purple',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-800'
    }
  };

  return (
    statusMap[status] || {
      label:
        status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      color: 'gray',
      bgClass: 'bg-gray-100',
      textClass: 'text-gray-800'
    }
  );
}

/**
 * Get CSS classes for status badge
 */
export function getStatusBadgeClasses(
  status: CaseStatus | ServiceTicketStatus
): string {
  const info = getStatusInfo(status);
  return `${info.bgClass} ${info.textClass}`;
}

/**
 * Check if a status indicates completion
 */
export function isCompletedStatus(
  status: CaseStatus | ServiceTicketStatus
): boolean {
  return ['completed', 'delivered', 'closed'].includes(status);
}

/**
 * Check if a status indicates active work
 */
export function isActiveStatus(
  status: CaseStatus | ServiceTicketStatus
): boolean {
  return ['triaged', 'in_progress', 'diagnosed'].includes(status);
}

/**
 * Check if a status indicates waiting/hold state
 */
export function isWaitingStatus(
  status: CaseStatus | ServiceTicketStatus
): boolean {
  return ['waiting_approval', 'on_hold', 'received'].includes(status);
}

/**
 * Get status priority for sorting (lower number = higher priority)
 */
export function getStatusPriority(
  status: CaseStatus | ServiceTicketStatus
): number {
  const priorityMap: Record<string, number> = {
    waiting_approval: 1,
    in_progress: 2,
    diagnosed: 3,
    triaged: 4,
    received: 5,
    reported: 6,
    on_hold: 7,
    completed: 8,
    delivered: 9,
    closed: 10,
    cancelled: 11
  };

  return priorityMap[status] || 999;
}

/**
 * Format status for display
 */
export function formatStatusLabel(
  status: CaseStatus | ServiceTicketStatus
): string {
  return getStatusInfo(status).label;
}

/**
 * Get next possible statuses for a given status
 */
export function getNextStatuses(
  status: CaseStatus | ServiceTicketStatus
): CaseStatus[] {
  const transitions: Record<string, CaseStatus[]> = {
    received: ['diagnosed', 'in_progress', 'on_hold', 'cancelled'],
    diagnosed: ['in_progress', 'on_hold', 'cancelled'],
    in_progress: ['completed', 'on_hold', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    completed: ['delivered'],
    delivered: [],
    cancelled: []
  };

  return transitions[status] || [];
}

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  from: CaseStatus | ServiceTicketStatus,
  to: CaseStatus | ServiceTicketStatus
): boolean {
  const nextStatuses = getNextStatuses(from);
  return nextStatuses.includes(to as CaseStatus);
}

/**
 * Format date for display
 */
export function formatDisplayDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format short date for compact display
 */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short'
  });
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Truncate serial number for display
 */
export function truncateSerial(serial: string, maxLength: number = 8): string {
  if (serial.length <= maxLength) return serial;
  return serial.slice(0, maxLength) + '...';
}

/**
 * Format registration number for display
 */
export function formatRegNumber(regNo: string | null | undefined): string {
  return regNo || 'No Reg';
}
