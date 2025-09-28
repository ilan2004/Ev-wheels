"use client";

import React, { useState, useEffect } from 'react';
import { 
  StatusCard, 
  EnhancedCard 
} from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconAlertTriangle,
  IconClock,
  IconUser,
  IconTruckDelivery,
  IconBell,
  IconX,
  IconCheck,
  IconRefresh,
  IconSettings
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

export interface Alert {
  id: string;
  type: 'overdue' | 'parts_pending' | 'customer_response' | 'unassigned' | 'sla_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  count: number;
  vehicleId?: string;
  actionUrl?: string;
  createdAt: Date;
  dismissible?: boolean;
}

interface VehicleAlertsProps {
  onAlertAction?: (alertId: string, action: 'view' | 'dismiss' | 'resolve') => void;
  onFilterSelect?: (filters: any) => void;
  className?: string;
}

export function VehicleAlerts({ onAlertAction, onFilterSelect, className }: VehicleAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Mock fetch alerts function (replace with actual API call)
  const fetchAlerts = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock alerts data
      const mockAlerts: Alert[] = [
        {
          id: 'alert-1',
          type: 'overdue',
          severity: 'critical',
          title: 'Overdue Vehicles',
          description: '7 vehicles are past their promised delivery date',
          count: 7,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          dismissible: false,
          actionUrl: '/dashboard/vehicles'
        },
        {
          id: 'alert-2',
          type: 'sla_risk',
          severity: 'high',
          title: 'SLA Risk (24h)',
          description: '4 vehicles due within 24 hours',
          count: 4,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          dismissible: true,
          actionUrl: '/dashboard/vehicles'
        },
        {
          id: 'alert-3',
          type: 'unassigned',
          severity: 'medium',
          title: 'Unassigned Vehicles',
          description: '12 vehicles waiting for technician assignment',
          count: 12,
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
          dismissible: true,
          actionUrl: '/dashboard/vehicles'
        },
        {
          id: 'alert-4',
          type: 'parts_pending',
          severity: 'medium',
          title: 'Parts Arrival Pending',
          description: '3 vehicles waiting for parts delivery',
          count: 3,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          dismissible: true,
          actionUrl: '/dashboard/inventory'
        },
        {
          id: 'alert-5',
          type: 'customer_response',
          severity: 'low',
          title: 'Customer Response Needed',
          description: '5 vehicles awaiting customer approval',
          count: 5,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          dismissible: true,
          actionUrl: '/dashboard/vehicles'
        }
      ];

      // Filter out dismissed alerts
      const visibleAlerts = mockAlerts.filter(alert => !dismissedAlerts.has(alert.id));
      setAlerts(visibleAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [dismissedAlerts]);

  // Handle alert actions
  const handleAlertAction = (alertId: string, action: 'view' | 'dismiss' | 'resolve') => {
    if (action === 'dismiss') {
      setDismissedAlerts(prev => {
        const next = new Set(prev);
        next.add(alertId);
        return next;
      });
    }
    onAlertAction?.(alertId, action);
  };

  // Get alert configuration based on type
  const getAlertConfig = (type: Alert['type']) => {
    const configs = {
      overdue: {
        icon: <IconAlertTriangle className="h-4 w-4" />,
        status: 'danger' as const,
        bgClass: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
        actionLabel: 'View Overdue',
        filterAction: () => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          onFilterSelect?.({ 
            dateTo: sevenDaysAgo.toISOString().split('T')[0],
            status: ['received', 'diagnosed', 'in_progress']
          });
        }
      },
      sla_risk: {
        icon: <IconClock className="h-4 w-4" />,
        status: 'warning' as const,
        bgClass: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
        actionLabel: 'Check SLA Risk',
        filterAction: () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          onFilterSelect?.({ 
            dateTo: tomorrow.toISOString().split('T')[0]
          });
        }
      },
      unassigned: {
        icon: <IconUser className="h-4 w-4" />,
        status: 'info' as const,
        bgClass: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        actionLabel: 'Assign Technicians',
        filterAction: () => onFilterSelect?.({ technicianId: 'unassigned' })
      },
      parts_pending: {
        icon: <IconTruckDelivery className="h-4 w-4" />,
        status: 'warning' as const,
        bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
        actionLabel: 'Check Parts Status',
        filterAction: () => onFilterSelect?.({ status: ['on_hold'] })
      },
      customer_response: {
        icon: <IconBell className="h-4 w-4" />,
        status: 'neutral' as const,
        bgClass: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
        actionLabel: 'Follow Up',
        filterAction: () => onFilterSelect?.({ status: ['customer_approval_needed'] })
      }
    };
    return configs[type];
  };

  // Get severity badge variant
  const getSeverityVariant = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">System Alerts</h2>
          <p className="text-sm text-muted-foreground">
            {visibleAlerts.length} active alerts requiring attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <IconSettings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <EnhancedCard variant="success" animated>
          <div className="p-6 text-center">
            <IconCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
              All Clear!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              No active alerts at this time. Great job keeping everything on track!
            </p>
          </div>
        </EnhancedCard>
      ) : (
        <div className="space-y-4">
          {visibleAlerts.map((alert, index) => {
            const config = getAlertConfig(alert.type);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <StatusCard
                  title={alert.title}
                  description={alert.description}
                  status={config.status}
                  icon={config.icon}
                  action={{
                    label: config.actionLabel,
                    onClick: () => {
                      config.filterAction();
                      handleAlertAction(alert.id, 'view');
                    }
                  }}
                  dismissible={alert.dismissible}
                  onDismiss={() => handleAlertAction(alert.id, 'dismiss')}
                  animated
                />
                <div className="flex items-center justify-between mt-2 px-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.count} vehicles
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {alert.createdAt.getHours()}:{alert.createdAt.getMinutes().toString().padStart(2, '0')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Alert Summary */}
      {visibleAlerts.length > 0 && (
        <EnhancedCard variant="elevated" animated className="mt-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Alert Summary</h3>
              <Badge variant="outline">
                {visibleAlerts.length} total
              </Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              {['critical', 'high', 'medium', 'low'].map((severity) => {
                const count = visibleAlerts.filter(a => a.severity === severity).length;
                const color = {
                  critical: 'text-red-600',
                  high: 'text-orange-600',
                  medium: 'text-yellow-600',
                  low: 'text-blue-600'
                }[severity];
                
                return (
                  <div key={severity} className="space-y-1">
                    <div className={`text-2xl font-bold ${color}`}>{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {severity}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm">
                View All Alerts
              </Button>
            </div>
          </div>
        </EnhancedCard>
      )}
    </div>
  );
}
