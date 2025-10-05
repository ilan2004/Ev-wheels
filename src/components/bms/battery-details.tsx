'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconArrowLeft,
  IconEdit,
  IconPrinter,
  IconQrcode,
  IconBattery,
  IconUser,
  IconClock,
  IconCurrency
} from '@tabler/icons-react';
import {
  BatteryRecord,
  BatteryStatus,
  BatteryStatusHistory,
  TechnicalDiagnostics,
  DiagnosticsFormData
} from '@/types/bms';
import { BatteryStatusWorkflow } from './battery-status-workflow';
import { BatteryDiagnostics } from './battery-diagnostics';
import { batteryApi } from '@/lib/api/batteries';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import Link from 'next/link';
import { EnhancedMediaUploader } from '@/components/job-cards/enhanced-media-uploader';
import type { TicketAttachment } from '@/lib/types/service-tickets';
import { supabase } from '@/lib/supabase/client';

interface BatteryDetailsProps {
  batteryId: string;
}

export function BatteryDetails({ batteryId }: BatteryDetailsProps) {
  const router = useRouter();
  const [battery, setBattery] = useState<BatteryRecord | null>(null);
  const [statusHistory, setStatusHistory] = useState<BatteryStatusHistory[]>(
    []
  );
  const [diagnostics, setDiagnostics] = useState<TechnicalDiagnostics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedTicket, setLinkedTicket] = useState<{
    id: string;
    ticket_number: string;
  } | null>(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [linkedVehicleCase, setLinkedVehicleCase] = useState<{
    id: string;
    vehicle_reg_no: string;
    vehicle_make: string;
    vehicle_model: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const fetchBatteryData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch battery details and status history in parallel
        const [batteryResponse, historyResponse] = await Promise.all([
          batteryApi.fetchBattery(batteryId),
          batteryApi.fetchStatusHistory(batteryId)
        ]);

        if (batteryResponse.success && batteryResponse.data) {
          setBattery(batteryResponse.data);
        } else {
          setError(batteryResponse.error || 'Failed to fetch battery details');
        }

        if (historyResponse.success && historyResponse.data) {
          setStatusHistory(historyResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatteryData();
  }, [batteryId]);

  useEffect(() => {
    const loadLinked = async () => {
      const res = await serviceTicketsApi.findTicketByBatteryCaseId(batteryId);
      if (res.success) {
        setLinkedTicket(res.data || null);

        // If we have a linked ticket, check for vehicle case
        if (res.data) {
          try {
            const ticketRes = await serviceTicketsApi.fetchTicketWithRelations(
              res.data.id
            );
            if (
              ticketRes.success &&
              ticketRes.data &&
              ticketRes.data.ticket.vehicle_case_id
            ) {
              // Fetch vehicle case details
              const vehicleRes = await (
                await import('@/lib/api/vehicles')
              ).vehiclesApi.fetchVehicle(ticketRes.data.ticket.vehicle_case_id);

              if (vehicleRes.success && vehicleRes.data) {
                setLinkedVehicleCase({
                  id: vehicleRes.data.id,
                  vehicle_reg_no: vehicleRes.data.vehicle_reg_no,
                  vehicle_make: vehicleRes.data.vehicle_make,
                  vehicle_model: vehicleRes.data.vehicle_model,
                  status: vehicleRes.data.status
                });
              }
            }
          } catch (error) {
            console.error(
              '[Battery Detail] Error loading linked vehicle case:',
              error
            );
          }
        }
      }
    };
    loadLinked();
  }, [batteryId]);

  useEffect(() => {
    const loadAtt = async () => {
      if (!linkedTicket) return;
      const res = await serviceTicketsApi.listBatteryAttachments(
        linkedTicket.id,
        batteryId
      );
      if (res.success && res.data) setAttachments(res.data);
    };
    loadAtt();
  }, [linkedTicket, batteryId]);

  const fetchDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const response = await batteryApi.fetchDiagnostics(batteryId);
      if (response.success && response.data) {
        setDiagnostics(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch diagnostics:', err);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handleDiagnosticsSave = async (diagnosticsData: any) => {
    try {
      const payload: DiagnosticsFormData = {
        total_cells: diagnosticsData.total_cells,
        healthy_cells: diagnosticsData.healthy_cells,
        weak_cells: diagnosticsData.weak_cells,
        dead_cells: diagnosticsData.dead_cells,
        ir_threshold: diagnosticsData.ir_threshold ?? 30,
        current_capacity: diagnosticsData.current_capacity,
        load_test_current: diagnosticsData.load_test_current,
        load_test_duration: diagnosticsData.load_test_duration,
        efficiency_rating: diagnosticsData.efficiency_rating,
        bms_error_codes: diagnosticsData.bms_error_codes,
        balancing_status: diagnosticsData.balancing_status,
        test_temperature: diagnosticsData.test_temperature
      };

      const response = await batteryApi.saveDiagnostics(batteryId, payload);
      if (response.success && response.data) {
        setDiagnostics(response.data);
      }
    } catch (err) {
      console.error('Failed to save diagnostics:', err);
      throw err; // Re-throw to let the diagnostics component handle the error
    }
  };

  const handleStatusChange = async (
    newStatus: BatteryStatus,
    notes: string
  ) => {
    if (!battery) return;

    try {
      const response = await batteryApi.updateBatteryStatus(
        batteryId,
        newStatus,
        notes
      );

      if (response.success && response.data) {
        setBattery(response.data);

        // Add to status history
        const newHistoryEntry: BatteryStatusHistory = {
          id: `hist-${Date.now()}`,
          battery_id: batteryId,
          previous_status: battery.status,
          new_status: newStatus,
          changed_by: 'current-user', // TODO: Get from auth context
          changed_at: new Date().toISOString(),
          notes
        };
        setStatusHistory([...statusHistory, newHistoryEntry]);
      }
    } catch (err) {
      console.error('Failed to update battery status:', err);
    }
  };

  const handleMediaUpload = async (files: File[], category: string) => {
    if (!linkedTicket) throw new Error('No linked ticket');

    // Determine attachment type based on category
    let attachmentType: 'photo' | 'audio' = 'photo';
    if (category === 'voice-notes') {
      attachmentType = 'audio';
    }

    const res = await serviceTicketsApi.uploadAttachments({
      ticketId: linkedTicket.id,
      files,
      type: attachmentType,
      caseType: 'battery',
      caseId: batteryId
    });

    if (!res.success) throw new Error(res.error || 'Failed to upload files');

    // Refresh attachments list
    const listed = await serviceTicketsApi.listBatteryAttachments(
      linkedTicket.id,
      batteryId
    );
    if (listed.success && listed.data) setAttachments(listed.data);
  };

  const handleGoBack = () => {
    router.push('/dashboard/batteries');
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={handleGoBack}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back to Batteries
          </Button>
        </div>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
            <p className='text-muted-foreground'>Loading battery details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={handleGoBack}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back to Batteries
          </Button>
        </div>
        <div className='py-12 text-center'>
          <p className='text-destructive mb-4'>{error}</p>
          <Button onClick={() => window.location.reload()} variant='outline'>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!battery) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={handleGoBack}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back to Batteries
          </Button>
        </div>
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>Battery not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
          <Button variant='outline' size='sm' onClick={handleGoBack}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back to Batteries
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Battery Details
            </h1>
            <p className='text-muted-foreground font-mono text-sm'>
              {battery.serial_number}
            </p>
            {linkedTicket && (
              <div className='mt-2 text-xs'>
                <span className='text-muted-foreground'>Linked Job Card: </span>
                <Link
                  className='underline'
                  href={`/dashboard/job-cards/${linkedTicket.id}`}
                >
                  {linkedTicket.ticket_number}
                </Link>
              </div>
            )}
            {linkedVehicleCase && (
              <div className='mt-2 flex items-center gap-2 text-xs'>
                <span className='text-muted-foreground'>Vehicle Case:</span>
                <Link
                  className='flex items-center gap-1 underline'
                  href={`/dashboard/vehicles/${linkedVehicleCase.id}`}
                >
                  <Badge variant='outline' className='text-xs'>
                    {linkedVehicleCase.vehicle_reg_no || 'No Reg'}
                  </Badge>
                  <span>
                    {linkedVehicleCase.vehicle_make}{' '}
                    {linkedVehicleCase.vehicle_model}
                  </span>
                  <Badge
                    variant={
                      linkedVehicleCase.status === 'completed'
                        ? 'default'
                        : 'secondary'
                    }
                    className='text-xs'
                  >
                    {linkedVehicleCase.status.replace('_', ' ')}
                  </Badge>
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className='flex w-full flex-col gap-2 sm:flex-row lg:w-auto'>
          <Button variant='outline' size='sm' className='w-full sm:w-auto'>
            <IconQrcode className='mr-2 h-4 w-4' />
            QR Code
          </Button>
          <Button variant='outline' size='sm' className='w-full sm:w-auto'>
            <IconPrinter className='mr-2 h-4 w-4' />
            Print Label
          </Button>
          <Button size='sm' className='w-full sm:w-auto'>
            <IconEdit className='mr-2 h-4 w-4' />
            Edit Battery
          </Button>
        </div>
      </div>

      {/* Custom breadcrumb with connectivity */}
      {linkedTicket && (
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Link href='/dashboard' className='hover:underline'>
            Dashboard
          </Link>
          <span>/</span>
          <Link href='/dashboard/job-cards' className='hover:underline'>
            Job Cards
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/job-cards/${linkedTicket.id}`}
            className='hover:underline'
          >
            {linkedTicket.ticket_number}
          </Link>
          <span>/</span>
          <span className='font-medium'>Battery</span>
          {linkedVehicleCase && (
            <>
              <span className='mx-2'>•</span>
              <Link
                href={`/dashboard/vehicles/${linkedVehicleCase.id}`}
                className='flex items-center gap-1 hover:underline'
              >
                <span className='text-xs'>Also:</span>
                <Badge variant='outline' className='text-xs'>
                  Vehicle
                </Badge>
              </Link>
            </>
          )}
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        {/* Main Content */}
        <div className='order-2 xl:order-1 xl:col-span-2'>
          <Tabs
            defaultValue='overview'
            className='space-y-6'
            onValueChange={(value) => {
              // Load diagnostics data when diagnostics tab is selected
              if (
                value === 'diagnostics' &&
                !diagnostics &&
                !diagnosticsLoading
              ) {
                fetchDiagnostics();
              }
            }}
          >
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='diagnostics'>Diagnostics</TabsTrigger>
              <TabsTrigger value='attachments'>Attachments</TabsTrigger>
              <TabsTrigger value='history'>History</TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='space-y-6'>
              {/* Battery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconBattery className='h-5 w-5' />
                    Battery Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-4'>
                      <div>
                        <p className='text-muted-foreground text-sm'>
                          Serial Number
                        </p>
                        <p className='font-mono font-medium'>
                          {battery.serial_number}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-sm'>
                          Brand & Model
                        </p>
                        <p className='font-medium'>{battery.brand}</p>
                        {battery.model && (
                          <p className='text-muted-foreground text-sm'>
                            {battery.model}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className='text-muted-foreground text-sm'>Type</p>
                        <Badge variant='outline'>{battery.battery_type}</Badge>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <p className='text-muted-foreground text-sm'>
                          Specifications
                        </p>
                        <p className='font-medium'>
                          {battery.voltage}V / {battery.capacity}Ah
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Cell Type: {battery.cell_type}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-sm'>
                          BMS Status
                        </p>
                        <Badge
                          variant={
                            battery.bms_status === 'ok'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {battery.bms_status?.toUpperCase()}
                        </Badge>
                      </div>
                      {battery.load_test_result && (
                        <div>
                          <p className='text-muted-foreground text-sm'>
                            Load Test Result
                          </p>
                          <p className='font-medium'>
                            {battery.load_test_result}% Efficiency
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconUser className='h-5 w-5' />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div>
                      <p className='text-muted-foreground text-sm'>
                        Customer Name
                      </p>
                      <p className='font-medium'>{battery.customer?.name}</p>
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>
                        Contact Number
                      </p>
                      <p className='font-medium'>
                        {battery.customer?.contact || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconClock className='h-5 w-5' />
                    Service Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div>
                      <p className='text-muted-foreground text-sm'>
                        Received Date
                      </p>
                      <p className='font-medium'>
                        {new Date(battery.received_date).toLocaleDateString(
                          'en-IN'
                        )}
                      </p>
                    </div>
                    {battery.delivered_date && (
                      <div>
                        <p className='text-muted-foreground text-sm'>
                          Delivered Date
                        </p>
                        <p className='font-medium'>
                          {new Date(battery.delivered_date).toLocaleDateString(
                            'en-IN'
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <IconCurrency className='h-5 w-5' />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-4'>
                      {battery.estimated_cost && (
                        <div>
                          <p className='text-muted-foreground text-sm'>
                            Estimated Cost
                          </p>
                          <p className='font-medium'>
                            ₹{battery.estimated_cost.toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}
                      {battery.final_cost && (
                        <div>
                          <p className='text-muted-foreground text-sm'>
                            Final Cost
                          </p>
                          <p className='text-lg font-medium'>
                            ₹{battery.final_cost.toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}
                    </div>

                    {(battery.parts_cost || battery.labor_cost) && (
                      <div className='space-y-4'>
                        {battery.parts_cost && (
                          <div>
                            <p className='text-muted-foreground text-sm'>
                              Parts Cost
                            </p>
                            <p className='font-medium'>
                              ₹{battery.parts_cost.toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}
                        {battery.labor_cost && (
                          <div>
                            <p className='text-muted-foreground text-sm'>
                              Labor Cost
                            </p>
                            <p className='font-medium'>
                              ₹{battery.labor_cost.toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Repair Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Repair Notes</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <p className='text-muted-foreground mb-2 text-sm'>
                      Initial Assessment
                    </p>
                    <p className='bg-muted rounded p-3 text-sm'>
                      {battery.repair_notes}
                    </p>
                  </div>

                  {battery.technician_notes && (
                    <div>
                      <p className='text-muted-foreground mb-2 text-sm'>
                        Technician Notes
                      </p>
                      <p className='bg-muted rounded p-3 text-sm'>
                        {battery.technician_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='diagnostics'>
              <BatteryDiagnostics
                batteryId={batteryId}
                initialData={
                  diagnostics
                    ? {
                        total_cells: diagnostics.total_cells,
                        healthy_cells: diagnostics.healthy_cells,
                        weak_cells: diagnostics.weak_cells,
                        dead_cells: diagnostics.dead_cells,
                        ir_threshold: diagnostics.ir_threshold,
                        current_capacity: diagnostics.current_capacity,
                        load_test_current: diagnostics.load_test_current,
                        load_test_duration: diagnostics.load_test_duration,
                        efficiency_rating: diagnostics.efficiency_rating,
                        bms_error_codes:
                          diagnostics.bms_error_codes?.join(', ') || '',
                        balancing_status: diagnostics.balancing_status,
                        test_temperature: diagnostics.test_temperature
                      }
                    : undefined
                }
                onSave={handleDiagnosticsSave}
              />
            </TabsContent>

            <TabsContent value='attachments' className='space-y-6'>
              {linkedTicket ? (
                <>
                  <div className='mb-4 flex items-center justify-between'>
                    <div className='text-muted-foreground text-sm'>
                      Battery-specific attachments
                    </div>
                    <Button variant='outline' size='sm' asChild>
                      <Link
                        href={`/dashboard/job-cards/${linkedTicket.id}?tab=attachments&scope=battery`}
                      >
                        View All Battery Attachments →
                      </Link>
                    </Button>
                  </div>
                  <EnhancedMediaUploader
                    onUpload={handleMediaUpload}
                    maxFileSize={10}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Existing Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attachments.length === 0 ? (
                        <div className='text-muted-foreground text-sm'>
                          No attachments yet.
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                          {attachments.map((a) => (
                            <BatteryAttachmentCard
                              key={a.id}
                              att={a}
                              onDeleted={async () => {
                                const api = serviceTicketsApi;
                                await api.deleteTicketAttachment(a.id);
                                const listed = await api.listBatteryAttachments(
                                  linkedTicket.id!,
                                  batteryId
                                );
                                if (listed.success && listed.data)
                                  setAttachments(listed.data);
                              }}
                              onReplaced={async (file) => {
                                const api = serviceTicketsApi;
                                await api.uploadAttachments({
                                  ticketId: linkedTicket.id!,
                                  files: [file],
                                  type: a.attachment_type,
                                  caseType: 'battery',
                                  caseId: batteryId
                                });
                                await api.deleteTicketAttachment(a.id);
                                const listed = await api.listBatteryAttachments(
                                  linkedTicket.id!,
                                  batteryId
                                );
                                if (listed.success && listed.data)
                                  setAttachments(listed.data);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-muted-foreground text-sm'>
                      This battery is not linked to a ticket. Link it via a
                      ticket to manage attachments.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value='history'>
              <Card>
                <CardHeader>
                  <CardTitle>Repair History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='py-8 text-center'>
                    <p className='text-muted-foreground'>
                      Detailed repair history will be displayed here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Status Sidebar */}
        <div className='order-1 xl:order-2'>
          <BatteryStatusWorkflow
            currentStatus={battery.status}
            batteryId={battery.id}
            onStatusChange={handleStatusChange}
            statusHistory={statusHistory}
          />
        </div>
      </div>
    </div>
  );
}

function BatteryAttachmentCard({
  att,
  onDeleted,
  onReplaced
}: {
  att: TicketAttachment;
  onDeleted: () => Promise<void>;
  onReplaced: (file: File) => Promise<void>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUrl = async () => {
      try {
        const bucket =
          att.attachment_type === 'audio' ? 'media-audio' : 'media-photos';
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(att.storage_path, 60 * 60);
        if (!error) setUrl(data?.signedUrl || null);
      } finally {
        setLoading(false);
      }
    };
    loadUrl();
  }, [att]);

  return (
    <div className='flex flex-col gap-2 rounded border p-2 text-xs'>
      <div className='font-medium break-all'>{att.original_name}</div>
      <div className='text-muted-foreground'>{att.attachment_type}</div>
      {!loading && url && att.attachment_type === 'photo' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={att.original_name}
          className='h-32 w-full rounded object-cover'
        />
      )}
      {!loading && url && att.attachment_type === 'audio' && (
        <>
          <audio src={url} controls className='w-full' />
          {typeof att.duration === 'number' && (
            <div className='text-muted-foreground'>
              Duration: {att.duration}s
            </div>
          )}
        </>
      )}
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fileInputRef.current?.click()}
        >
          Replace
        </Button>
        <Button variant='destructive' size='sm' onClick={onDeleted}>
          Delete
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type='file'
        className='hidden'
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await onReplaced(f);
        }}
      />
    </div>
  );
}
