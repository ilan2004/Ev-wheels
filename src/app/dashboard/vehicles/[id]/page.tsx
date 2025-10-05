'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SectionHeader } from '@/components/layout/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  vehiclesApi,
  type VehicleCase,
  type VehicleStatus
} from '@/lib/api/vehicles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  VehicleStatusHistory,
  TicketAttachment
} from '@/lib/types/service-tickets';
import { EnhancedMediaUploader } from '@/components/job-cards/enhanced-media-uploader';
import { EnhancedStatusWorkflow } from '@/components/vehicles/enhanced-status-workflow';
import { supabase } from '@/lib/supabase/client';
import PageContainer from '@/components/layout/page-container';
import { toast } from 'sonner';

const STATUSES: VehicleStatus[] = [
  'received',
  'diagnosed',
  'in_progress',
  'completed',
  'delivered',
  'on_hold',
  'cancelled'
];

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicleId = params?.id as string;

  const [vehicle, setVehicle] = useState<VehicleCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<VehicleStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [linkedBatteryCase, setLinkedBatteryCase] = useState<{
    id: string;
    serial_number: string;
    status: string;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await vehiclesApi.fetchVehicle(vehicleId);
    if (res.success && res.data) setVehicle(res.data);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (vehicleId) load();
  }, [vehicleId]);

  useEffect(() => {
    const loadAttachments = async () => {
      if (!vehicleId || !vehicle) return;
      console.log('[Vehicle Attachments] Loading for:', {
        vehicleId: vehicle.id,
        ticketId: vehicle.service_ticket_id
      });
      const res = await (
        await import('@/lib/api/service-tickets')
      ).serviceTicketsApi.listVehicleAttachments(
        vehicle.service_ticket_id,
        vehicle.id
      );
      console.log('[Vehicle Attachments] Response:', res);
      if (res.success && res.data) {
        console.log(
          '[Vehicle Attachments] Found:',
          res.data.length,
          'attachments'
        );
        setAttachments(res.data);
      }
    };
    loadAttachments();
  }, [vehicleId, vehicle]);

  useEffect(() => {
    const loadLinkedBatteryCase = async () => {
      if (!vehicle?.service_ticket_id) return;
      try {
        // Fetch the ticket to check if it has a battery_case_id
        const ticketRes = await (
          await import('@/lib/api/service-tickets')
        ).serviceTicketsApi.fetchTicketWithRelations(vehicle.service_ticket_id);

        if (
          ticketRes.success &&
          ticketRes.data &&
          ticketRes.data.ticket.battery_case_id
        ) {
          // Fetch battery case details
          const batteryRes = await (
            await import('@/lib/api/batteries')
          ).batteryApi.fetchBattery(ticketRes.data.ticket.battery_case_id);

          if (batteryRes.success && batteryRes.data) {
            setLinkedBatteryCase({
              id: batteryRes.data.id,
              serial_number: batteryRes.data.serial_number,
              status: batteryRes.data.status
            });
          }
        }
      } catch (error) {
        console.error(
          '[Vehicle Detail] Error loading linked battery case:',
          error
        );
      }
    };
    loadLinkedBatteryCase();
  }, [vehicle?.service_ticket_id]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!vehicleId) return;
      setHistoryLoading(true);
      const res = await vehiclesApi.listVehicleHistory(vehicleId);
      if (res.success && res.data) setHistory(res.data);
      setHistoryLoading(false);
    };
    loadHistory();
  }, [vehicleId]);

  const handleMediaUpload = async (files: File[], category: string) => {
    if (!vehicle) throw new Error('Vehicle not loaded');

    // Determine attachment type based on category
    let attachmentType: 'photo' | 'audio' = 'photo';
    if (category === 'voice-notes') {
      attachmentType = 'audio';
    }

    const res = await (
      await import('@/lib/api/service-tickets')
    ).serviceTicketsApi.uploadAttachments({
      ticketId: vehicle.service_ticket_id,
      files,
      type: attachmentType,
      caseType: 'vehicle',
      caseId: vehicle.id
    });

    if (!res.success) throw new Error(res.error || 'Failed to upload files');

    // Refresh attachments list
    const listed = await (
      await import('@/lib/api/service-tickets')
    ).serviceTicketsApi.listVehicleAttachments(
      vehicle.service_ticket_id,
      vehicle.id
    );
    if (listed.success && listed.data) setAttachments(listed.data);
  };

  const onChangeStatus = async (
    newStatus: VehicleStatus,
    statusNotes?: string
  ) => {
    if (!vehicle) return;
    setIsUpdating(true);

    try {
      const res = await vehiclesApi.updateVehicleStatus(
        vehicle.id,
        newStatus,
        statusNotes
      );
      if (res.success && res.data) {
        setVehicle(res.data);
        setNotes('');

        toast.success(
          `Vehicle status changed to ${newStatus.replace('_', ' ')}`
        );

        // Refresh history
        const historyRes = await vehiclesApi.listVehicleHistory(vehicleId);
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data);
        }
      } else {
        throw new Error(res.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
      throw error; // Re-throw for the component to handle
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!vehicle) return <div>Vehicle case not found</div>;

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <SectionHeader
          title='Vehicle Case Details'
          description='Diagnosis and repair status'
        />

        {/* Custom breadcrumb with connectivity */}
        {vehicle && (
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
              href={`/dashboard/job-cards/${vehicle.service_ticket_id}`}
              className='hover:underline'
            >
              {vehicle.service_ticket_id.slice(-8)}
            </Link>
            <span>/</span>
            <span className='font-medium'>Vehicle</span>
            {linkedBatteryCase && (
              <>
                <span className='mx-2'>•</span>
                <Link
                  href={`/dashboard/batteries/${linkedBatteryCase.id}`}
                  className='flex items-center gap-1 hover:underline'
                >
                  <span className='text-xs'>Also:</span>
                  <Badge variant='outline' className='text-xs'>
                    Battery
                  </Badge>
                </Link>
              </>
            )}
          </div>
        )}

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push('/dashboard/vehicles')}
          >
            Back
          </Button>
          <div className='text-muted-foreground flex items-center gap-4 text-sm'>
            <div>
              Linked Ticket:{' '}
              <Link
                className='underline'
                href={`/dashboard/tickets/${vehicle.service_ticket_id}`}
              >
                {vehicle.service_ticket_id}
              </Link>
            </div>
            {linkedBatteryCase && (
              <div className='flex items-center gap-2'>
                <span>•</span>
                <Link
                  className='flex items-center gap-1 underline'
                  href={`/dashboard/batteries/${linkedBatteryCase.id}`}
                >
                  <span>Battery Case:</span>
                  <Badge variant='outline' className='text-xs'>
                    {linkedBatteryCase.serial_number}
                  </Badge>
                  <Badge
                    variant={
                      linkedBatteryCase.status === 'completed'
                        ? 'default'
                        : 'secondary'
                    }
                    className='text-xs'
                  >
                    {linkedBatteryCase.status.replace('_', ' ')}
                  </Badge>
                </Link>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='bg-background/80 supports-[backdrop-filter]:bg-background/50 sticky top-0 z-10 mb-4 backdrop-blur'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='history'>History</TabsTrigger>
            <TabsTrigger value='attachments'>Attachments</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
                <div>
                  <div className='text-muted-foreground'>Reg No</div>
                  <div className='font-medium'>
                    {vehicle.vehicle_reg_no || '-'}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>Make & Model</div>
                  <div className='font-medium'>
                    {vehicle.vehicle_make} {vehicle.vehicle_model}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>Status</div>
                  <div>
                    <Badge variant='secondary'>{vehicle.status}</Badge>
                  </div>
                </div>
                <div className='md:col-span-3'>
                  <div className='text-muted-foreground'>Technician Notes</div>
                  <div className='text-sm'>
                    {vehicle.technician_notes || '-'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <EnhancedStatusWorkflow
              vehicle={vehicle}
              onStatusChange={onChangeStatus}
              isUpdating={isUpdating}
            />
          </TabsContent>

          <TabsContent value='history'>
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className='text-muted-foreground text-sm'>
                    Loading...
                  </div>
                ) : history.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No history yet.
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {history.map((h) => (
                      <div key={h.id} className='flex items-start gap-3'>
                        <div className='bg-primary mt-1 h-2 w-2 rounded-full' />
                        <div className='text-sm'>
                          <div className='font-medium'>
                            {new Date(h.changed_at).toLocaleString()} •{' '}
                            {h.new_status.replace('_', ' ')}
                          </div>
                          {h.notes && (
                            <div className='text-muted-foreground'>
                              {h.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='attachments' className='space-y-6'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='text-muted-foreground text-sm'>
                Vehicle-specific attachments
              </div>
              {vehicle && (
                <Button variant='outline' size='sm' asChild>
                  <Link
                    href={`/dashboard/tickets/${vehicle.service_ticket_id}`}
                  >
                    View Linked Ticket →
                  </Link>
                </Button>
              )}
            </div>
            <EnhancedMediaUploader
              onUpload={handleMediaUpload}
              maxFileSize={10}
            />
            <Card>
              <CardHeader>
                <CardTitle>Existing</CardTitle>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No attachments yet.
                  </div>
                ) : (
                  <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    {attachments.map((a) => (
                      <VehicleAttachmentCard
                        key={a.id}
                        att={a}
                        onDeleted={async () => {
                          const api = (
                            await import('@/lib/api/service-tickets')
                          ).serviceTicketsApi;
                          await api.deleteTicketAttachment(a.id);
                          const listed = await api.listVehicleAttachments(
                            vehicle!.service_ticket_id,
                            vehicle!.id
                          );
                          if (listed.success && listed.data)
                            setAttachments(listed.data);
                        }}
                        onReplaced={async (file) => {
                          const api = (
                            await import('@/lib/api/service-tickets')
                          ).serviceTicketsApi;
                          await api.uploadAttachments({
                            ticketId: vehicle!.service_ticket_id,
                            files: [file],
                            type: a.attachment_type,
                            caseType: 'vehicle',
                            caseId: vehicle!.id
                          });
                          await api.deleteTicketAttachment(a.id);
                          const listed = await api.listVehicleAttachments(
                            vehicle!.service_ticket_id,
                            vehicle!.id
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
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

function VehicleAttachmentCard({
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
