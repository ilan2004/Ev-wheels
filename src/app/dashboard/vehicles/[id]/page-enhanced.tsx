'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

// UI Components
import { SectionHeader } from '@/components/layout/section-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Custom Components
import PageContainer from '@/components/layout/page-container';
import { EnhancedAttachmentManager } from './components/enhanced-attachment-manager';
import { EnhancedStatusWorkflow } from '@/components/vehicles/enhanced-status-workflow';
// import { VehicleInfoCard } from "./components/vehicle-info-card";
// import { ActivityTimeline } from "./components/activity-timeline";
// import { QuickActions } from "./components/quick-actions";
// import { CostEstimator } from "./components/cost-estimator";

// Icons
import {
  ArrowLeft,
  Car,
  Clock,
  DollarSign,
  FileText,
  History,
  Image,
  Info,
  MapPin,
  MessageSquare,
  MoreVertical,
  Package,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  Settings,
  Share2,
  Star,
  Timer,
  TrendingUp,
  User,
  Wrench,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Mail,
  ChevronRight,
  Download,
  Upload,
  Zap,
  Activity,
  BarChart3
} from 'lucide-react';

// API and Types
import {
  vehiclesApi,
  type VehicleCase,
  type VehicleStatus
} from '@/lib/api/vehicles';
import type {
  VehicleStatusHistory,
  TicketAttachment
} from '@/lib/types/service-tickets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Constants
const STATUSES: VehicleStatus[] = [
  'received',
  'diagnosed',
  'in_progress',
  'completed',
  'delivered',
  'on_hold',
  'cancelled'
];

const STATUS_CONFIG: Record<
  VehicleStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  received: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Car,
    description: 'Vehicle has been received and logged'
  },
  diagnosed: {
    label: 'Diagnosed',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: FileText,
    description: 'Initial diagnosis completed'
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Wrench,
    description: 'Repair work is underway'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    description: 'All repairs have been completed'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Package,
    description: 'Vehicle has been delivered to customer'
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Clock,
    description: 'Work paused pending approval or parts'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
    description: 'Service request has been cancelled'
  }
};

// Enhanced Loading Skeleton
const VehicleDetailSkeleton = () => (
  <div className='space-y-6'>
    <div className='flex items-center gap-4'>
      <Skeleton className='h-10 w-24' />
      <Skeleton className='h-4 w-48' />
    </div>

    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='space-y-6 lg:col-span-2'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-20 w-full' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-48 w-full' />
          </CardContent>
        </Card>
      </div>

      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-36' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-5/6' />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Enhanced Error Component
const ErrorDisplay = ({
  error,
  onRetry
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className='flex min-h-[400px] flex-col items-center justify-center p-8'>
    <AlertCircle className='text-destructive mb-4 h-16 w-16' />
    <h2 className='mb-2 text-2xl font-semibold'>Something went wrong</h2>
    <p className='text-muted-foreground mb-6 max-w-md text-center'>{error}</p>
    <Button onClick={onRetry} variant='default'>
      <RefreshCw className='mr-2 h-4 w-4' />
      Try Again
    </Button>
  </div>
);

export default function EnhancedVehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // const { toast } = useToast(); // Using sonner instead
  const vehicleId = params?.id as string;

  // State Management
  const [vehicle, setVehicle] = useState<VehicleCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<VehicleStatusHistory[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  // Data fetching with error handling
  const loadVehicle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehicleRes, historyRes] = await Promise.all([
        vehiclesApi.fetchVehicle(vehicleId),
        vehiclesApi.listVehicleHistory(vehicleId)
      ]);

      if (vehicleRes.success && vehicleRes.data) {
        setVehicle(vehicleRes.data);

        // Load attachments if vehicle has service_ticket_id
        if (vehicleRes.data.service_ticket_id) {
          const attachmentsRes = await import('@/lib/api/service-tickets').then(
            (mod) =>
              mod.serviceTicketsApi.listVehicleAttachments(
                vehicleRes.data!.service_ticket_id,
                vehicleRes.data!.id
              )
          );

          if (attachmentsRes.success && attachmentsRes.data) {
            setAttachments(attachmentsRes.data);
          }
        }
      } else {
        setError(vehicleRes.error || 'Failed to load vehicle details');
      }

      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading vehicle:', err);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  // Initial load
  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId, loadVehicle]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isUpdating && !loading) {
        setRefreshing(true);
        loadVehicle().finally(() => setRefreshing(false));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadVehicle, isUpdating, loading]);

  // Status change handler with confirmation
  const handleStatusChange = async (newStatus: VehicleStatus) => {
    if (!vehicle) return;

    setSelectedStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!vehicle || !selectedStatus) return;

    setIsUpdating(true);
    setShowStatusDialog(false);

    try {
      const res = await vehiclesApi.updateVehicleStatus(
        vehicle.id,
        selectedStatus,
        notes || undefined
      );

      if (res.success && res.data) {
        setVehicle(res.data);
        setNotes('');
        toast.success(
          `Vehicle status changed to ${STATUS_CONFIG[selectedStatus].label}`
        );

        // Reload history
        const historyRes = await vehiclesApi.listVehicleHistory(vehicle.id);
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data);
        }
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
      setSelectedStatus(null);
    }
  };

  // Calculate vehicle metrics
  const metrics = useMemo(() => {
    if (!vehicle) return null;

    const daysInService = Math.floor(
      (Date.now() - new Date(vehicle.received_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const estimatedCompletion =
      vehicle.status === 'in_progress'
        ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        : null;

    const completionPercentage = {
      received: 10,
      diagnosed: 25,
      in_progress: 60,
      completed: 90,
      delivered: 100,
      on_hold: 50,
      cancelled: 0
    }[vehicle.status];

    return {
      daysInService,
      estimatedCompletion,
      completionPercentage,
      isUrgent: daysInService > 7,
      isCritical: daysInService > 14
    };
  }, [vehicle]);

  // Render states
  if (loading) {
    return (
      <PageContainer>
        <VehicleDetailSkeleton />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorDisplay error={error} onRetry={loadVehicle} />
      </PageContainer>
    );
  }

  if (!vehicle) {
    return (
      <PageContainer>
        <ErrorDisplay
          error='Vehicle not found'
          onRetry={() => router.push('/dashboard/vehicles')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Enhanced Header */}
        <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => router.push('/dashboard/vehicles')}
              className='shrink-0'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>

            <div>
              <h1 className='flex items-center gap-2 text-2xl font-bold'>
                {vehicle.vehicle_make} {vehicle.vehicle_model}
                {metrics?.isUrgent && (
                  <Badge variant='destructive' className='animate-pulse'>
                    Urgent
                  </Badge>
                )}
              </h1>
              <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm'>
                <span>{vehicle.vehicle_reg_no}</span>
                <ChevronRight className='h-3 w-3' />
                <Link
                  href={`/dashboard/tickets/${vehicle.service_ticket_id}`}
                  className='hover:text-primary transition-colors'
                >
                  Ticket #{vehicle.service_ticket_id.slice(0, 8)}
                </Link>
                {refreshing && (
                  <Loader2 className='ml-2 h-3 w-3 animate-spin' />
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions - Component not yet implemented */}
          {/* <QuickActions vehicle={vehicle} onRefresh={loadVehicle} /> */}
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={loadVehicle}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        {metrics && (
          <Card className='from-primary/5 to-primary/10 border-none bg-gradient-to-r shadow-sm'>
            <CardContent className='p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm font-medium'>Service Progress</span>
                <span className='text-muted-foreground text-sm'>
                  {metrics.completionPercentage}% Complete
                </span>
              </div>
              <Progress value={metrics.completionPercentage} className='h-2' />

              <div className='text-muted-foreground mt-3 flex justify-between text-xs'>
                <div className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  <span>{metrics.daysInService} days in service</span>
                </div>
                {metrics.estimatedCompletion && (
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    <span>
                      Est. completion:{' '}
                      {format(metrics.estimatedCompletion, 'MMM dd')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
          {/* Left Column - Main Content */}
          <div className='space-y-6 xl:col-span-2'>
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2 lg:grid-cols-4'>
                <TabsTrigger value='overview' className='text-xs sm:text-sm'>
                  <Info className='mr-2 h-4 w-4' />
                  Overview
                </TabsTrigger>
                <TabsTrigger value='history' className='text-xs sm:text-sm'>
                  <History className='mr-2 h-4 w-4' />
                  History
                </TabsTrigger>
                <TabsTrigger value='attachments' className='text-xs sm:text-sm'>
                  <Image className='mr-2 h-4 w-4' />
                  Files
                </TabsTrigger>
                <TabsTrigger value='costs' className='text-xs sm:text-sm'>
                  <DollarSign className='mr-2 h-4 w-4' />
                  Costs
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-6'>
                {/* Vehicle Information - Component not yet implemented */}
                {/* <VehicleInfoCard vehicle={vehicle} customer={vehicle.customer} /> */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Vehicle info component placeholder - to be implemented
                    </p>
                  </CardContent>
                </Card>

                {/* Status Workflow */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Management</CardTitle>
                    <CardDescription>
                      Update the repair status and track progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnhancedStatusWorkflow
                      vehicle={vehicle}
                      onStatusChange={handleStatusChange}
                      isUpdating={isUpdating}
                    />
                  </CardContent>
                </Card>

                {/* Technician Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Technician Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder='Add detailed notes about the repair...'
                      value={vehicle.technician_notes || ''}
                      onChange={(e) => {
                        // Handle notes update
                      }}
                      className='min-h-[100px]'
                    />
                    <Button className='mt-3' size='sm'>
                      Save Notes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='history' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                    <CardDescription>
                      Complete history of status changes and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* <ActivityTimeline history={history} /> */}
                    <p>
                      Activity timeline component placeholder - to be
                      implemented
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='attachments' className='space-y-6'>
                <EnhancedAttachmentManager
                  vehicleId={vehicle.id}
                  ticketId={vehicle.service_ticket_id}
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              </TabsContent>

              <TabsContent value='costs' className='space-y-6'>
                {/* <CostEstimator
                  vehicle={vehicle}
                  onUpdate={(updatedVehicle) => setVehicle(updatedVehicle)}
                /> */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Estimator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Cost estimator component placeholder - to be implemented
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className='space-y-6'>
            {/* Customer Information - To be implemented when customer data is available */}
            {/* {vehicle.customer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {vehicle.customer.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{vehicle.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Customer ID: {vehicle.customer.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  
                  {vehicle.customer.contact && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="mr-2 h-4 w-4" />
                      {vehicle.customer.contact}
                    </Button>
                  )}
                  
                  {vehicle.customer.email && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact via Email
                    </Button>
                  )}
                </CardContent>
              </Card>
            )} */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-sm'>
                  Customer ID: {vehicle.customer_id.slice(0, 8)}
                </p>
                <p className='text-muted-foreground mt-2 text-xs'>
                  Full customer details to be implemented
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Days in Service
                  </span>
                  <Badge
                    variant={metrics?.isUrgent ? 'destructive' : 'secondary'}
                  >
                    {metrics?.daysInService} days
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Current Status
                  </span>
                  <Badge className={cn(STATUS_CONFIG[vehicle.status].color)}>
                    {STATUS_CONFIG[vehicle.status].label}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Attachments
                  </span>
                  <Badge variant='outline'>{attachments.length} files</Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    Last Updated
                  </span>
                  <span className='text-sm'>
                    {formatDistanceToNow(new Date(vehicle.updated_at), {
                      addSuffix: true
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Printer className='mr-2 h-4 w-4' />
                  Print Service Report
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Download className='mr-2 h-4 w-4' />
                  Export as PDF
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <QrCode className='mr-2 h-4 w-4' />
                  Generate QR Code
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Share Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status to{' '}
              <span className='font-semibold'>
                {selectedStatus && STATUS_CONFIG[selectedStatus].label}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='bg-muted rounded-lg p-3'>
              <p className='text-sm'>
                {selectedStatus && STATUS_CONFIG[selectedStatus].description}
              </p>
            </div>

            <div>
              <label className='text-sm font-medium'>Add Note (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Add any relevant notes...'
                className='mt-1'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowStatusDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={isUpdating}>
              {isUpdating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
