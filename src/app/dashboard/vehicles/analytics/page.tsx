"use client";

import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { SectionHeader } from '@/components/layout/section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  VehicleDashboard 
} from '@/components/vehicles/vehicle-dashboard';
import { 
  VehicleAlerts 
} from '@/components/vehicles/vehicle-alerts';
import { 
  VehicleReports 
} from '@/components/vehicles/vehicle-reports';
import {
  IconChartBar,
  IconBell,
  IconFileText,
  IconArrowLeft,
  IconSettings,
  IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VehicleAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertsCount, setAlertsCount] = useState(7); // This would come from actual alerts data

  // Handle filter selection from dashboard components
  const handleFilterSelect = (filters: any) => {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach((status: string) => params.append('status', status));
      } else {
        params.append('status', filters.status);
      }
    }
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.technicianId) params.append('technicianId', filters.technicianId);
    if (filters.customerId) params.append('customerId', filters.customerId);

    // Navigate to vehicles list with filters
    router.push(`/dashboard/vehicles?${params.toString()}`);
  };

  // Handle report generation
  const handleReportGenerate = (reportType: string, format: string, params: any) => {
    console.log('Generating report:', { reportType, format, params });
    
    // In a real implementation, this would trigger the report generation API
    // and handle file download
    
    // Mock implementation - show success message
    alert(`Report "${reportType}" in ${format.toUpperCase()} format is being generated. You'll receive a download link shortly.`);
  };

  // Handle alert actions
  const handleAlertAction = (alertId: string, action: 'view' | 'dismiss' | 'resolve') => {
    console.log('Alert action:', { alertId, action });
    
    if (action === 'dismiss') {
      setAlertsCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/vehicles')}
            >
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Button>
            <div>
              <SectionHeader
                title="Vehicle Analytics"
                description="Comprehensive analytics and insights for vehicle operations"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <IconSettings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <IconChartBar className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <IconBell className="h-4 w-4" />
              Alerts
              {alertsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {alertsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <IconFileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <VehicleDashboard 
              onFilterSelect={handleFilterSelect}
              className="w-full"
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <VehicleAlerts
              onAlertAction={handleAlertAction}
              onFilterSelect={handleFilterSelect}
              className="w-full"
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <VehicleReports
              onReportGenerate={handleReportGenerate}
              className="w-full"
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
