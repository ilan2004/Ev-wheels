'use client';

import React from 'react';
import {
  AccessibleDashboardWrapper,
  AccessibleSection,
  AccessibleGrid,
  AccessibilityDebugPanel
} from './accessible-dashboard-wrapper';
import {
  AccessibleKPICard,
  AccessibleAlertList,
  AccessibleSearch,
  AccessibleNotificationCenter
} from './accessible-components';
import {
  AccessibleButton,
  AccessibleTooltip,
  LiveRegion
} from './accessibility-helpers';

// Example integration of accessibility features with the existing dashboard
interface AccessibleManagerDashboardProps {
  // Existing props from your dashboard
  emergencyMode?: boolean;
  onEmergencyToggle?: () => void;
}

export function AccessibleManagerDashboard({
  emergencyMode = false,
  onEmergencyToggle
}: AccessibleManagerDashboardProps) {
  // Example data - replace with your actual data
  const mockKPIs = [
    {
      title: 'Active Tickets',
      value: '23',
      description: '5 high priority',
      trend: { value: 12, label: '12% increase from yesterday' },
      status: 'warning' as const,
      onClick: () => console.log('Navigate to tickets')
    },
    {
      title: 'Technicians Available',
      value: '8/12',
      description: '4 on assignments',
      status: 'normal' as const
    },
    {
      title: 'Average Response Time',
      value: '45min',
      trend: { value: -8, label: '8% faster than last week' },
      status: 'normal' as const
    },
    {
      title: 'Customer Satisfaction',
      value: '4.8/5',
      trend: { value: 3, label: '3% improvement' },
      status: 'normal' as const
    }
  ];

  const mockAlerts = [
    {
      id: '1',
      title: 'Battery Temperature Critical',
      description: 'Vehicle ID: EV-2024-001 requires immediate attention',
      severity: 'critical' as const,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Technician Overdue',
      description: 'John Doe has not checked in for 2 hours',
      severity: 'high' as const,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'Low Battery Alert',
      description: 'Multiple vehicles showing low battery warnings',
      severity: 'medium' as const,
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    }
  ];

  const mockNotifications = [
    {
      id: 'n1',
      title: 'New Service Request',
      message: 'Customer reported battery charging issue',
      type: 'info' as const,
      timestamp: new Date().toISOString(),
      read: false,
      actions: [
        {
          label: 'Assign Technician',
          onClick: () => console.log('Assign technician'),
          variant: 'default' as const
        }
      ]
    },
    {
      id: 'n2',
      title: 'Maintenance Complete',
      message: 'Battery replacement completed for vehicle EV-2024-002',
      type: 'success' as const,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: true
    }
  ];

  return (
    <AccessibleDashboardWrapper
      emergencyMode={emergencyMode}
      onEmergencyToggle={onEmergencyToggle}
    >
      {/* Header Section */}
      <AccessibleSection
        id='section-1'
        title='Dashboard Header'
        headingLevel={1}
        className='border-b p-6'
      >
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
              Service Manager Dashboard
            </h1>
            <p className='mt-1 text-gray-600 dark:text-gray-300'>
              EV Battery Service Operations
            </p>
          </div>

          <div className='flex items-center space-x-4'>
            {/* Search */}
            <div id='search' className='w-64'>
              <AccessibleSearch
                placeholder='Search job cards, customers, vehicles...'
                onSearch={(query) => console.log('Search:', query)}
                onClear={() => console.log('Search cleared')}
              />
            </div>

            {/* Notifications */}
            <AccessibleNotificationCenter
              notifications={mockNotifications}
              onMarkAsRead={(id) => console.log('Mark as read:', id)}
              onMarkAllAsRead={() => console.log('Mark all as read')}
              onClearAll={() => console.log('Clear all notifications')}
            />

            {/* Emergency Toggle */}
            <AccessibleTooltip content='Toggle emergency mode for priority operations'>
              <AccessibleButton
                variant={emergencyMode ? 'destructive' : 'outline'}
                onClick={onEmergencyToggle}
                aria-label={`${emergencyMode ? 'Deactivate' : 'Activate'} emergency mode`}
                aria-pressed={emergencyMode}
              >
                🚨 Emergency
              </AccessibleButton>
            </AccessibleTooltip>
          </div>
        </div>
      </AccessibleSection>

      {/* KPIs Section */}
      <AccessibleSection
        id='section-2'
        title='Key Performance Indicators'
        className='p-6'
        emergency={emergencyMode}
      >
        <div id='kpis'>
          <AccessibleGrid cols={4} gap={6}>
            {mockKPIs.map((kpi, index) => (
              <AccessibleKPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                description={kpi.description}
                trend={kpi.trend}
                status={kpi.status}
                onClick={kpi.onClick}
              />
            ))}
          </AccessibleGrid>
        </div>
      </AccessibleSection>

      {/* Alerts Section */}
      <AccessibleSection
        id='section-3'
        title='Active Alerts'
        className='p-6'
        emergency={
          emergencyMode && mockAlerts.some((a) => a.severity === 'critical')
        }
      >
        <div id='alerts'>
          <AccessibleAlertList
            alerts={mockAlerts}
            onFilterChange={(severity) =>
              console.log('Filter alerts:', severity)
            }
          />
        </div>
      </AccessibleSection>

      {/* Quick Actions Section */}
      <AccessibleSection id='section-4' title='Quick Actions' className='p-6'>
        <AccessibleGrid cols={3} gap={4}>
          <AccessibleButton
            variant='outline'
            className='h-24 flex-col'
            aria-describedby='create-ticket-desc'
          >
            <span className='mb-1 text-lg'>📋</span>
            <span>Create Job Card</span>
            <div id='create-ticket-desc' className='sr-only'>
              Create a new job card for a customer issue
            </div>
          </AccessibleButton>

          <AccessibleButton
            variant='outline'
            className='h-24 flex-col'
            aria-describedby='assign-tech-desc'
          >
            <span className='mb-1 text-lg'>👥</span>
            <span>Assign Technician</span>
            <div id='assign-tech-desc' className='sr-only'>
              Assign available technician to pending service requests
            </div>
          </AccessibleButton>

          <AccessibleButton
            variant='outline'
            className='h-24 flex-col'
            aria-describedby='view-reports-desc'
          >
            <span className='mb-1 text-lg'>📊</span>
            <span>View Reports</span>
            <div id='view-reports-desc' className='sr-only'>
              Access performance reports and analytics
            </div>
          </AccessibleButton>
        </AccessibleGrid>
      </AccessibleSection>

      {/* Additional sections would follow the same pattern... */}

      {/* Development Tools */}
      <AccessibilityDebugPanel />
    </AccessibleDashboardWrapper>
  );
}

// HOC to wrap existing components with accessibility features
export function withAccessibility<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    skipLink?: { id: string; label: string };
    section?: {
      id: string;
      title: string;
      headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    };
    liveRegion?: boolean;
  } = {}
) {
  return function AccessibleComponent(props: T) {
    const { skipLink, section, liveRegion } = options;

    const content = <Component {...props} />;

    if (section) {
      return (
        <AccessibleSection
          id={section.id}
          title={section.title}
          headingLevel={section.headingLevel}
        >
          {content}
          {liveRegion && <LiveRegion />}
        </AccessibleSection>
      );
    }

    return (
      <>
        {content}
        {liveRegion && <LiveRegion />}
      </>
    );
  };
}

// Migration utilities to help convert existing components
export const AccessibilityMigrationUtils = {
  // Convert regular buttons to accessible buttons
  upgradeButton: (buttonProps: any) => ({
    ...buttonProps,
    'aria-label': buttonProps['aria-label'] || buttonProps.children,
    role: 'button',
    tabIndex: 0
  }),

  // Add ARIA labels to existing cards
  upgradeCard: (cardProps: any) => ({
    ...cardProps,
    role: 'region',
    'aria-label': cardProps['aria-label'] || cardProps.title
  }),

  // Add proper heading structure
  upgradeHeading: (level: number, text: string) => ({
    as: `h${level}` as React.ElementType,
    id: `heading-${text.toLowerCase().replace(/\s+/g, '-')}`,
    children: text
  }),

  // Add live region for dynamic content
  addLiveRegion: (
    content: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => ({
    'aria-live': priority,
    'aria-atomic': 'true',
    children: content
  })
};

// Example of how to migrate an existing component
export function migrateExistingComponent() {
  // Before (existing component):
  /*
  <div className="card">
    <h3>Service Tickets</h3>
    <button onClick={handleClick}>View All</button>
  </div>
  */

  // After (accessible version):
  return (
    <AccessibleSection
      id='service-tickets'
      title='Job Cards'
      headingLevel={2}
    >
      <AccessibleButton
        onClick={() => console.log('View all job cards')}
        aria-label='View all job cards'
      >
        View All
      </AccessibleButton>
    </AccessibleSection>
  );
}

export default AccessibleManagerDashboard;
