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
import {
  FormFileUpload,
  type FileUploadConfig
} from '@/components/forms/form-file-upload';
import { EnhancedStatusWorkflow } from '@/components/vehicles/enhanced-status-workflow';
import { supabase } from '@/lib/supabase/client';
import PageContainer from '@/components/layout/page-container';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
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
  const [photoProgresses, setPhotoProgresses] = useState<
    Record<string, number>
  >({});
  const [audioProgresses, setAudioProgresses] = useState<
    Record<string, number>
  >({});

  const form = useForm<{ photos: File[]; audio: File[] }>({
    defaultValues: { photos: [], audio: [] }
  });

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
      const res = await (
        await import('@/lib/api/service-tickets')
      ).serviceTicketsApi.listVehicleAttachments(
        vehicle.service_ticket_id,
        vehicle.id
      );
      if (res.success && res.data) setAttachments(res.data);
    };
    loadAttachments();
  }, [vehicleId, vehicle]);

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

  const photoUploadConfig: FileUploadConfig = {
    acceptedTypes: ['image/*'],
    multiple: true,
    maxFiles: 8,
    maxSize: 10 * 1024 * 1024,
    progresses: photoProgresses,
    onUpload: async (files) => {
      if (!vehicle) throw new Error('Vehicle not loaded');
      const res = await (
        await import('@/lib/api/service-tickets')
      ).serviceTicketsApi.uploadAttachments({
        ticketId: vehicle.service_ticket_id,
        files,
        type: 'photo',
        caseType: 'vehicle',
        caseId: vehicle.id,
        onProgress: (file, progress) =>
          setPhotoProgresses((p) => ({ ...p, [file.name]: progress }))
      });
      if (!res.success) throw new Error(res.error || 'Failed to upload photos');
      const listed = await (
        await import('@/lib/api/service-tickets')
      ).serviceTicketsApi.listVehicleAttachments(
        vehicle.service_ticket_id,
        vehicle.id
      );
      if (listed.success && listed.data) setAttachments(listed.data);
    }
  };

  const audioUploadConfig: FileUploadConfig = {
    acceptedTypes: ['audio/*'],
    multiple: true,
    maxFiles: 3,
    maxSize: 15 * 1024 * 1024,
    progresses: audioProgresses,
    onUpload: async (files) => {
      if (!vehicle) throw new Error('Vehicle not loaded');
      const res = await (
        await import('@/lib/api/service-tickets')
      ).serviceTicketsApi.uploadAttachments({
        ticketId: vehicle.service_ticket_id,
        files,
        type: 'audio',
        caseType: 'vehicle',
        caseId: vehicle.id,
        onProgress: (file, progress) =>
          setAudioProgresses((p) => ({ ...p, [file.name]: progress }))
      });
      if (!res.success) throw new Error(res.error || 'Failed to upload audio');
      const listed = await (
        await import('@/lib/api/service-tickets')
      ).serviceTicketsApi.listVehicleAttachments(
        vehicle.service_ticket_id,
        vehicle.id
      );
      if (listed.success && listed.data) setAttachments(listed.data);
    }
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

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push('/dashboard/vehicles')}
          >
            Back
          </Button>
          <div className='text-muted-foreground text-sm'>
            Linked Ticket:{' '}
            <Link
              className='underline'
              href={`/dashboard/tickets/${vehicle.service_ticket_id}`}
            >
              {vehicle.service_ticket_id}
            </Link>
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
            <Card>
              <CardHeader>
                <CardTitle>Upload</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <Form {...form}>
                  <form
                    className='space-y-6'
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <FormFileUpload
                      control={form.control}
                      name={'photos'}
                      label='Photos'
                      config={photoUploadConfig}
                    />
                    <FormFileUpload
                      control={form.control}
                      name={'audio'}
                      label='Voice Notes'
                      config={audioUploadConfig}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>
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
