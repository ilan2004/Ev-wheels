'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  IconDownload,
  IconFileText,
  IconFileSpreadsheet,
  IconCalendar,
  IconLoader2,
  IconEye,
  IconSettings
} from '@tabler/icons-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { EnhancedCard } from '@/components/ui/enhanced-card';

export type ReportType =
  | 'daily_service'
  | 'technician_performance'
  | 'customer_history'
  | 'revenue_analysis'
  | 'vehicle_status'
  | 'sla_compliance';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'operational' | 'performance' | 'financial';
  requiredParams?: string[];
  supportedFormats: ExportFormat[];
  estimatedTime: string;
  color: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

interface VehicleReportsProps {
  className?: string;
  onReportGenerate?: (
    reportType: ReportType,
    format: ExportFormat,
    params: any
  ) => void;
}

export function VehicleReports({
  className,
  onReportGenerate
}: VehicleReportsProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [customParams, setCustomParams] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Report configurations
  const reportConfigs: ReportConfig[] = [
    {
      id: 'daily_service',
      name: 'Daily Service Report',
      description: 'Comprehensive daily operations summary',
      icon: <IconFileText className='h-5 w-5' />,
      category: 'operational',
      supportedFormats: ['pdf', 'excel'],
      estimatedTime: '2-3 mins',
      color: 'bg-blue-500'
    },
    {
      id: 'technician_performance',
      name: 'Technician Performance',
      description: 'Individual and team performance metrics',
      icon: <IconFileSpreadsheet className='h-5 w-5' />,
      category: 'performance',
      requiredParams: ['technician_id'],
      supportedFormats: ['pdf', 'excel', 'csv'],
      estimatedTime: '1-2 mins',
      color: 'bg-green-500'
    },
    {
      id: 'customer_history',
      name: 'Customer History',
      description: 'Customer service records and trends',
      icon: <IconFileText className='h-5 w-5' />,
      category: 'operational',
      requiredParams: ['customer_id'],
      supportedFormats: ['pdf', 'excel'],
      estimatedTime: '1 min',
      color: 'bg-purple-500'
    },
    {
      id: 'revenue_analysis',
      name: 'Revenue Analysis',
      description: 'Financial performance and revenue breakdown',
      icon: <IconFileSpreadsheet className='h-5 w-5' />,
      category: 'financial',
      supportedFormats: ['pdf', 'excel', 'csv'],
      estimatedTime: '3-4 mins',
      color: 'bg-orange-500'
    },
    {
      id: 'vehicle_status',
      name: 'Vehicle Status Report',
      description: 'Current status and workload distribution',
      icon: <IconFileText className='h-5 w-5' />,
      category: 'operational',
      supportedFormats: ['csv', 'excel'],
      estimatedTime: '1 min',
      color: 'bg-cyan-500'
    },
    {
      id: 'sla_compliance',
      name: 'SLA Compliance Report',
      description: 'Service level agreement performance tracking',
      icon: <IconFileText className='h-5 w-5' />,
      category: 'performance',
      supportedFormats: ['pdf', 'excel'],
      estimatedTime: '2 mins',
      color: 'bg-red-500'
    }
  ];

  // Get format icon
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <IconFileText className='h-4 w-4' />;
      case 'excel':
        return <IconFileSpreadsheet className='h-4 w-4' />;
      case 'csv':
        return <IconFileText className='h-4 w-4' />;
    }
  };

  // Get format color
  const getFormatColor = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return 'text-red-600';
      case 'excel':
        return 'text-green-600';
      case 'csv':
        return 'text-blue-600';
    }
  };

  // Handle report generation
  const handleGenerateReport = useCallback(async () => {
    if (!selectedReport) return;

    setIsGenerating(true);
    try {
      const params = {
        dateRange,
        ...customParams,
        format: selectedFormat
      };

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      onReportGenerate?.(selectedReport, selectedFormat, params);

      // Reset state
      setSelectedReport(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedReport,
    selectedFormat,
    dateRange,
    customParams,
    onReportGenerate
  ]);

  // Get category reports
  const getReportsByCategory = (category: string) => {
    return reportConfigs.filter((report) => report.category === category);
  };

  return (
    <div className={className}>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Reports</h2>
          <p className='text-muted-foreground'>
            Generate and export detailed analytics reports
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <IconSettings className='mr-2 h-4 w-4' />
            Preferences
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mb-8 grid gap-4 md:grid-cols-3'>
        <EnhancedCard
          variant='elevated'
          hoverable
          onClick={() => setSelectedReport('daily_service')}
        >
          <div className='p-4 text-center'>
            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50'>
              <IconFileText className='h-6 w-6 text-blue-600' />
            </div>
            <h3 className='mb-1 font-semibold'>Today&apos;s Report</h3>
            <p className='text-muted-foreground mb-3 text-sm'>
              Generate today&apos;s service summary
            </p>
            <Button size='sm' className='w-full'>
              Generate Now
            </Button>
          </div>
        </EnhancedCard>

        <EnhancedCard
          variant='elevated'
          hoverable
          onClick={() => setSelectedReport('vehicle_status')}
        >
          <div className='p-4 text-center'>
            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50'>
              <IconFileText className='h-6 w-6 text-cyan-600' />
            </div>
            <h3 className='mb-1 font-semibold'>Status Export</h3>
            <p className='text-muted-foreground mb-3 text-sm'>
              Export current vehicle statuses
            </p>
            <Button size='sm' variant='outline' className='w-full'>
              Export CSV
            </Button>
          </div>
        </EnhancedCard>

        <EnhancedCard
          variant='elevated'
          hoverable
          onClick={() => setSelectedReport('sla_compliance')}
        >
          <div className='p-4 text-center'>
            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50'>
              <IconFileText className='h-6 w-6 text-red-600' />
            </div>
            <h3 className='mb-1 font-semibold'>SLA Report</h3>
            <p className='text-muted-foreground mb-3 text-sm'>
              Check compliance metrics
            </p>
            <Button size='sm' variant='outline' className='w-full'>
              Generate PDF
            </Button>
          </div>
        </EnhancedCard>
      </div>

      {/* Report Categories */}
      <div className='space-y-8'>
        {['operational', 'performance', 'financial'].map((category) => (
          <div key={category}>
            <div className='mb-4 flex items-center gap-2'>
              <h3 className='text-lg font-semibold capitalize'>
                {category} Reports
              </h3>
              <Badge variant='outline'>
                {getReportsByCategory(category).length} reports
              </Badge>
            </div>

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {getReportsByCategory(category).map((report) => (
                <Card
                  key={report.id}
                  className='cursor-pointer transition-shadow hover:shadow-md'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            report.color,
                            'text-white'
                          )}
                        >
                          {report.icon}
                        </div>
                        <div>
                          <CardTitle className='text-base'>
                            {report.name}
                          </CardTitle>
                          <CardDescription className='text-sm'>
                            {report.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className='pt-0'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Est. time:
                        </span>
                        <span className='font-medium'>
                          {report.estimatedTime}
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        <span className='text-muted-foreground text-sm'>
                          Formats:
                        </span>
                        {report.supportedFormats.map((format) => (
                          <div key={format} className='flex items-center gap-1'>
                            <div
                              className={cn('h-4 w-4', getFormatColor(format))}
                            >
                              {getFormatIcon(format)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className='flex gap-2 pt-2'>
                        <Button
                          size='sm'
                          className='flex-1'
                          onClick={() => {
                            setSelectedReport(report.id);
                            setSelectedFormat(report.supportedFormats[0]);
                            setShowConfirmDialog(true);
                          }}
                        >
                          <IconDownload className='mr-2 h-4 w-4' />
                          Generate
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            // Handle preview
                          }}
                        >
                          <IconEye className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Report Generation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='max-w-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Report</AlertDialogTitle>
            <AlertDialogDescription>
              Configure your report parameters before generation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedReport && (
            <div className='space-y-4'>
              {/* Report Info */}
              <div className='bg-muted/50 flex items-center gap-3 rounded-lg p-3'>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-white',
                    reportConfigs.find((r) => r.id === selectedReport)?.color
                  )}
                >
                  {reportConfigs.find((r) => r.id === selectedReport)?.icon}
                </div>
                <div>
                  <h4 className='font-semibold'>
                    {reportConfigs.find((r) => r.id === selectedReport)?.name}
                  </h4>
                  <p className='text-muted-foreground text-sm'>
                    {
                      reportConfigs.find((r) => r.id === selectedReport)
                        ?.description
                    }
                  </p>
                </div>
              </div>

              {/* Format Selection */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Export Format</label>
                <Select
                  value={selectedFormat}
                  onValueChange={(value: ExportFormat) =>
                    setSelectedFormat(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportConfigs
                      .find((r) => r.id === selectedReport)
                      ?.supportedFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          <div className='flex items-center gap-2'>
                            <div className={getFormatColor(format)}>
                              {getFormatIcon(format)}
                            </div>
                            {format.toUpperCase()}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Selection */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal'
                      >
                        <IconCalendar className='mr-2 h-4 w-4' />
                        {format(dateRange.from, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={dateRange.from}
                        onSelect={(date) =>
                          date &&
                          setDateRange((prev) => ({ ...prev, from: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal'
                      >
                        <IconCalendar className='mr-2 h-4 w-4' />
                        {format(dateRange.to, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={dateRange.to}
                        onSelect={(date) =>
                          date &&
                          setDateRange((prev) => ({ ...prev, to: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Additional Parameters */}
              {reportConfigs.find((r) => r.id === selectedReport)
                ?.requiredParams && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Additional Parameters
                  </label>
                  <p className='text-muted-foreground text-sm'>
                    This report requires additional parameters to be configured.
                  </p>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGenerating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating && (
                <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Generate Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
