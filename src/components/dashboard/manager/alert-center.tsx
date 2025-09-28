'use client';

import React from 'react';
import {
  IconAlertTriangle,
  IconClock,
  IconUsers,
  IconArrowRight,
  IconCheck
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AlertData {
  overdue: number;
  dueToday: number;
  unassigned: number;
  qualityIssues?: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  action: {
    label: string;
    onClick: () => void;
  };
  visible: boolean;
}

interface AlertCenterProps {
  data: AlertData;
  onFilterClick: (filter: string) => void;
  loading?: boolean;
}

function AlertCard({ alert }: { alert: Alert }) {
  if (!alert.visible || alert.count === 0) return null;

  const variants = {
    critical: {
      cardClass: 'border-red-200 bg-red-50 hover:bg-red-100',
      iconBg: 'bg-red-100',
      iconClass: 'text-red-600',
      titleClass: 'text-red-800',
      descClass: 'text-red-600',
      badge: 'destructive' as const,
      pulseClass: 'animate-pulse'
    },
    warning: {
      cardClass: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
      iconBg: 'bg-amber-100',
      iconClass: 'text-amber-600',
      titleClass: 'text-amber-800',
      descClass: 'text-amber-600',
      badge: 'secondary' as const,
      pulseClass: ''
    },
    info: {
      cardClass: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      iconBg: 'bg-blue-100',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-800',
      descClass: 'text-blue-600',
      badge: 'outline' as const,
      pulseClass: ''
    }
  };

  const style = variants[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`${style.cardClass} transition-all duration-200 cursor-pointer ${style.pulseClass}`}
        onClick={alert.action.onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${style.iconBg} ${style.iconClass} rounded-full p-2`}>
                {alert.icon}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${style.titleClass}`}>
                  {alert.title}
                </div>
                <div className={`text-sm ${style.descClass}`}>
                  {alert.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={style.badge} className="font-medium">
                {alert.count}
              </Badge>
              <IconArrowRight className={`h-4 w-4 ${style.iconClass}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div>
                  <div className="h-4 w-24 bg-muted rounded mb-1"></div>
                  <div className="h-3 w-32 bg-muted rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-8 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AlertCenter({
  data,
  onFilterClick,
  loading = false
}: AlertCenterProps) {
  const alerts: Alert[] = [
    {
      id: 'overdue',
      type: 'critical',
      title: 'Overdue Tickets',
      description: 'Tickets past due and still open',
      count: data.overdue,
      icon: <IconAlertTriangle className="h-5 w-5" />,
      action: {
        label: `${data.overdue} overdue`,
        onClick: () => onFilterClick('overdue')
      },
      visible: data.overdue > 0
    },
    {
      id: 'due-today',
      type: 'warning',
      title: 'Due Today',
      description: 'Tickets that need completion today',
      count: data.dueToday,
      icon: <IconClock className="h-5 w-5" />,
      action: {
        label: `${data.dueToday} due`,
        onClick: () => onFilterClick('due-today')
      },
      visible: data.dueToday > 0
    },
    {
      id: 'unassigned',
      type: 'info',
      title: 'Unassigned Tickets',
      description: 'Tickets waiting for technician assignment',
      count: data.unassigned,
      icon: <IconUsers className="h-5 w-5" />,
      action: {
        label: `${data.unassigned} unassigned`,
        onClick: () => onFilterClick('unassigned')
      },
      visible: data.unassigned > 0
    }
  ];

  const visibleAlerts = alerts.filter(alert => alert.visible);
  const totalIssues = data.overdue + data.dueToday + data.unassigned;

  if (loading) {
    return (
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Alert Center</h2>
          <p className="text-sm text-muted-foreground">
            Critical issues requiring attention
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Alert Center
            {totalIssues > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalIssues}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalIssues > 0
              ? 'Critical issues requiring immediate attention'
              : 'All clear - no urgent issues'
            }
          </p>
        </div>
        {totalIssues === 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <IconCheck className="h-5 w-5" />
            <span className="text-sm font-medium">All Clear</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {visibleAlerts.length > 0 ? (
          visibleAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <AlertCard alert={alert} />
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-green-100 text-green-600 rounded-full p-3">
                    <IconCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="font-medium text-green-800">
                      Excellent Work!
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      No overdue tickets or urgent issues. Keep up the great work!
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      {totalIssues > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex flex-wrap gap-2 justify-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterClick('all-critical')}
            className="text-xs"
          >
            View All Critical
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterClick('assign-bulk')}
            className="text-xs"
          >
            Bulk Assign
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
