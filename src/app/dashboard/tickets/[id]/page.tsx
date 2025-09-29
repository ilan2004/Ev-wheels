'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { SectionHeader } from '@/components/layout/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type {
  ServiceTicket,
  TicketAttachment
} from '@/lib/types/service-tickets';
import type { Customer } from '@/types/bms';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormFileUpload,
  type FileUploadConfig
} from '@/components/forms/form-file-upload';
import CaptureControls from '@/components/media/capture-controls';
import { MediaViewerModal } from '@/components/media/media-viewer-modal';
import { toast } from 'sonner';
import type { ServiceTicketHistory } from '@/lib/types/service-tickets';
import PageContainer from '@/components/layout/page-container';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { useAuth } from '@/hooks/use-auth';

export default function TicketDetailPage() {
  // Require an authenticated session to view and upload attachments
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const ticketId = params?.id as string;
  const { isAdmin, isTechnician } = useAuth();
  const canEdit = isAdmin || isTechnician;
  const [ticket, setTicket] = useState<
    (ServiceTicket & { customer?: Customer }) | null
  >(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ServiceTicketHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Phase 2 state: attachments filter/sort/selection and viewer
  const [attFilter, setAttFilter] = useState<'all' | 'photo' | 'audio'>('all');
  const [attSort, setAttSort] = useState<'newest' | 'oldest' | 'size'>(
    'newest'
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [attUrls, setAttUrls] = useState<Record<string, string>>({});
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'created' | 'triaged' | 'status_changed' | 'updated'
  >('all');

  useEffect(() => {
    const load = async () => {
      const res = await serviceTicketsApi.fetchTicketWithRelations(ticketId);
      if (res.success && res.data) {
        setTicket(res.data.ticket);
        setAttachments(res.data.attachments);
      }
      setLoading(false);
    };
    if (ticketId) load();
  }, [ticketId]);

  // Generate signed URLs for attachments (photos/audio) when list changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const a of attachments) {
        const bucket =
          a.attachment_type === 'audio' ? 'media-audio' : 'media-photos';
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(a.storage_path, 3600);
          if (!error && data?.signedUrl) map[a.id] = data.signedUrl;
        } catch {}
      }
      if (!cancelled) setAttUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [attachments]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!ticketId) return;
      setHistoryLoading(true);
      const res = await serviceTicketsApi.listTicketHistory(ticketId);
      if (res.success && res.data) setHistory(res.data);
      setHistoryLoading(false);
    };
    loadHistory();
  }, [ticketId]);

  const photoConfig: FileUploadConfig = useMemo(
    () => ({
      acceptedTypes: ['image/*'],
      multiple: true,
      maxFiles: 8,
      maxSize: 10 * 1024 * 1024, // 10MB per file
      onUpload: async (files) => {
        const res = await serviceTicketsApi.uploadAttachments({
          ticketId,
          files,
          type: 'photo'
        });
        if (!res.success)
          throw new Error(res.error || 'Failed to upload photos');
        const listed = await serviceTicketsApi.listTicketAttachments(ticketId);
        if (listed.success && listed.data) setAttachments(listed.data);
      }
    }),
    [ticketId]
  );

  const audioConfig: FileUploadConfig = useMemo(
    () => ({
      acceptedTypes: ['audio/*'],
      multiple: true,
      maxFiles: 3,
      maxSize: 15 * 1024 * 1024, // 15MB per file
      onUpload: async (files) => {
        const res = await serviceTicketsApi.uploadAttachments({
          ticketId,
          files,
          type: 'audio'
        });
        if (!res.success)
          throw new Error(res.error || 'Failed to upload audio');
        const listed = await serviceTicketsApi.listTicketAttachments(ticketId);
        if (listed.success && listed.data) setAttachments(listed.data);
      }
    }),
    [ticketId]
  );

  const triageSchema = z.object({
    routeTo: z.enum(['vehicle', 'battery', 'both']),
    note: z.string().optional()
  });
  const triageForm = useForm<{
    routeTo: 'vehicle' | 'battery' | 'both';
    note?: string;
  }>({
    resolver: zodResolver(triageSchema),
    defaultValues: { routeTo: 'vehicle', note: '' }
  });

  const triageTemplates = [
    'Initial inspection started',
    'Customer contacted for more details',
    'Awaiting parts',
    'Requesting consent for repair'
  ];

  // Local form context for attachments tab to satisfy FormField and Controller
  const uploadsForm = useForm<{ photos: File[]; audio: File[] }>({
    defaultValues: { photos: [], audio: [] }
  });

  async function onTriageSubmit(values: {
    routeTo: 'vehicle' | 'battery' | 'both';
    note?: string;
  }) {
    const res = await serviceTicketsApi.triageTicket({
      ticketId,
      routeTo: values.routeTo,
      note: values.note
    });
    if (!res.success) return toast.error(res.error || 'Failed to triage');
    toast.success('Ticket triaged');
    // Reload ticket
    const updated = await serviceTicketsApi.fetchTicketWithRelations(ticketId);
    if (updated.success && updated.data) setTicket(updated.data.ticket);
  }

  if (loading)
    return (
      <PageContainer>
        <div className='flex flex-col gap-6'>
          <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 backdrop-blur'>
            <div className='flex items-center justify-between px-2 py-3'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-5 w-20 rounded-full' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-28' />
                <Skeleton className='h-8 w-28' />
              </div>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <Skeleton className='h-40 md:col-span-2' />
            <Skeleton className='h-40' />
          </div>
        </div>
      </PageContainer>
    );
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <StickyTicketHeader
          ticket={ticket}
          canEdit={canEdit}
          onStatusChange={async (s) => {
            const res = await serviceTicketsApi.updateTicketStatus(ticketId, s);
            if (!res.success) {
              toast.error(res.error || 'Failed');
              return;
            }
            const updated =
              await serviceTicketsApi.fetchTicketWithRelations(ticketId);
            if (updated.success && updated.data) setTicket(updated.data.ticket);
            const h = await serviceTicketsApi.listTicketHistory(ticketId);
            if (h.success && h.data) setHistory(h.data);
            toast.success('Status updated');
          }}
        />
        <SectionHeader
          title={`Ticket ${ticket.ticket_number}`}
          description={ticket.symptom}
        />

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='mb-4'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='attachments'>Attachments</TabsTrigger>
            <TabsTrigger value='activity'>Activity</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
                <div>
                  <div className='text-muted-foreground'>Customer</div>
                  <div>{ticket.customer?.name || '-'}</div>
                </div>
                <div>
                  <div className='text-muted-foreground'>Status</div>
                  <div>
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>Vehicle</div>
                  <div>
                    {ticket.vehicle_make || '-'} {ticket.vehicle_model || ''}{' '}
                    {ticket.vehicle_reg_no ? `(${ticket.vehicle_reg_no})` : ''}
                  </div>
                </div>
                <div className='md:col-span-3'>
                  <div className='text-muted-foreground'>Description</div>
                  <div>{ticket.description || '-'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2 text-sm'>
                {ticket.status === 'waiting_approval' ? (
                  <>
                    <div>
                      <Badge variant='outline'>Pending customer approval</Badge>
                    </div>
                    {ticket.triage_notes && (
                      <div>
                        <div className='text-muted-foreground'>
                          Last approval note
                        </div>
                        <div className='whitespace-pre-wrap'>
                          {ticket.triage_notes}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className='text-muted-foreground'>
                    No pending approval for this ticket.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked Cases</CardTitle>
              </CardHeader>
              <CardContent>
                {!ticket.battery_case_id && !ticket.vehicle_case_id && (
                  <div className='text-muted-foreground text-sm'>
                    No linked cases yet.
                  </div>
                )}
                <div className='flex flex-wrap gap-3'>
                  {ticket.battery_case_id && (
                    <Button variant='outline' asChild>
                      <Link
                        href={`/dashboard/batteries/${ticket.battery_case_id}`}
                      >
                        Battery Case
                      </Link>
                    </Button>
                  )}
                  {ticket.vehicle_case_id && (
                    <Button variant='outline'>Vehicle Case</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Triage & Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Triage templates */}
                <div className='flex flex-wrap gap-2'>
                  {triageTemplates.map((tmpl) => (
                    <button
                      key={tmpl}
                      type='button'
                      className='bg-muted hover:bg-secondary rounded px-2 py-1 text-xs'
                      onClick={() => {
                        const curr = triageForm.getValues('note') || '';
                        const sep = curr ? '\n' : '';
                        triageForm.setValue('note', `${curr}${sep}${tmpl}`);
                      }}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>

                <Form {...triageForm}>
                  <form
                    onSubmit={triageForm.handleSubmit(onTriageSubmit)}
                    className='grid grid-cols-1 gap-4 md:grid-cols-3'
                  >
                    <FormField
                      name='routeTo'
                      control={triageForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route To</FormLabel>
                          <FormControl>
                            <select
                              className='rounded border px-2 py-2'
                              {...field}
                            >
                              <option value='vehicle'>Vehicle</option>
                              <option value='battery'>Battery</option>
                              <option value='both'>Both</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name='note'
                      control={triageForm.control}
                      render={({ field }) => (
                        <FormItem className='md:col-span-2'>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Optional triage note'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='flex justify-end gap-2 md:col-span-3'>
                      <Button type='submit'>Apply Triage</Button>
                    </div>
                  </form>
                </Form>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div className='md:col-span-2'>
                    <Textarea
                      id='approval-note'
                      placeholder='Approval note (optional)'
                      className='w-full'
                    />
                    {ticket.status === 'waiting_approval' && (
                      <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={async () => {
                            try {
                              await fetch('/api/notifications/slack', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  text: `Reminder: approval pending for Ticket ${ticket.ticket_number}`
                                })
                              });
                              toast.success('Reminder sent');
                            } catch {
                              toast.error('Failed to send reminder');
                            }
                          }}
                        >
                          Send reminder
                        </Button>
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                window.location.href
                              );
                              toast.success('Link copied');
                            } catch {
                              toast.error('Copy failed');
                            }
                          }}
                        >
                          Copy link
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className='flex items-start md:justify-end'>
                    <Button
                      onClick={async () => {
                        const note =
                          (
                            document.getElementById(
                              'approval-note'
                            ) as HTMLTextAreaElement
                          )?.value || '';
                        const res = await serviceTicketsApi.updateTicketStatus(
                          ticketId,
                          'waiting_approval',
                          note
                        );
                        if (!res.success)
                          return toast.error(res.error || 'Failed');
                        toast.success('Approval requested');
                        // refresh history
                        const h =
                          await serviceTicketsApi.listTicketHistory(ticketId);
                        if (h.success && h.data) setHistory(h.data);
                        // refresh ticket to reflect new status and note
                        const updated =
                          await serviceTicketsApi.fetchTicketWithRelations(
                            ticketId
                          );
                        if (updated.success && updated.data)
                          setTicket(updated.data.ticket);
                      }}
                      variant='outline'
                    >
                      Request Customer Approval
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment removed: technicians self-handle; no assignee */}
          </TabsContent>

          <TabsContent value='attachments' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Upload</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <Form {...uploadsForm}>
                  <div className='space-y-6'>
                    <div className='space-y-2'>
                      <FormFileUpload
                        control={uploadsForm.control}
                        name={'photos' as const}
                        label='Photos'
                        config={photoConfig}
                      />
                      <CaptureControls
                        onPhotos={async (files) => {
                          const res = await serviceTicketsApi.uploadAttachments(
                            { ticketId, files, type: 'photo' }
                          );
                          if (!res.success) {
                            toast.error(res.error || 'Failed to upload photo');
                            return;
                          }
                          const listed =
                            await serviceTicketsApi.listTicketAttachments(
                              ticketId
                            );
                          if (listed.success && listed.data)
                            setAttachments(listed.data);
                        }}
                      />
                    </div>

                    <div className='space-y-2'>
                      <FormFileUpload
                        control={uploadsForm.control}
                        name={'audio' as const}
                        label='Voice Notes'
                        config={audioConfig}
                      />
                      <CaptureControls
                        onAudio={async (files) => {
                          const res = await serviceTicketsApi.uploadAttachments(
                            { ticketId, files, type: 'audio' }
                          );
                          if (!res.success) {
                            toast.error(res.error || 'Failed to upload audio');
                            return;
                          }
                          const listed =
                            await serviceTicketsApi.listTicketAttachments(
                              ticketId
                            );
                          if (listed.success && listed.data)
                            setAttachments(listed.data);
                        }}
                      />
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Existing</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Toolbar */}
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='flex items-center gap-1 text-sm'>
                    <button
                      onClick={() => setAttFilter('all')}
                      className={`rounded px-2 py-1 ${attFilter === 'all' ? 'bg-secondary' : 'hover:bg-muted'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAttFilter('photo')}
                      className={`rounded px-2 py-1 ${attFilter === 'photo' ? 'bg-secondary' : 'hover:bg-muted'}`}
                    >
                      Photos
                    </button>
                    <button
                      onClick={() => setAttFilter('audio')}
                      className={`rounded px-2 py-1 ${attFilter === 'audio' ? 'bg-secondary' : 'hover:bg-muted'}`}
                    >
                      Audio
                    </button>
                  </div>
                  <div className='ml-auto flex items-center gap-2 text-sm'>
                    <span className='text-muted-foreground'>Sort</span>
                    <select
                      value={attSort}
                      onChange={(e) => setAttSort(e.target.value as any)}
                      className='rounded border px-2 py-1 text-sm'
                    >
                      <option value='newest'>Newest</option>
                      <option value='oldest'>Oldest</option>
                      <option value='size'>Size</option>
                    </select>
                    <button
                      disabled={selectedIds.size === 0}
                      onClick={async () => {
                        const api = serviceTicketsApi;
                        await Promise.all(
                          Array.from(selectedIds).map((id) =>
                            api.deleteTicketAttachment(id)
                          )
                        );
                        setSelectedIds(new Set());
                        const listed =
                          await api.listTicketAttachments(ticketId);
                        if (listed.success && listed.data)
                          setAttachments(listed.data);
                      }}
                      className={`rounded px-2 py-1 ${selectedIds.size ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>

                {/* Grid */}
                {attachments.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No attachments yet.
                  </div>
                ) : (
                  <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    {attachments
                      .filter((a) =>
                        attFilter === 'all'
                          ? true
                          : attFilter === 'photo'
                            ? a.attachment_type === 'photo'
                            : a.attachment_type === 'audio'
                      )
                      .sort((a, b) => {
                        if (attSort === 'size')
                          return (b.file_size || 0) - (a.file_size || 0);
                        if (attSort === 'oldest')
                          return (
                            new Date(a.uploaded_at).getTime() -
                            new Date(b.uploaded_at).getTime()
                          );
                        return (
                          new Date(b.uploaded_at).getTime() -
                          new Date(a.uploaded_at).getTime()
                        );
                      })
                      .map((a, idx) => (
                        <div
                          key={a.id}
                          className={`relative flex flex-col gap-2 rounded border p-2 text-xs ${selectedIds.has(a.id) ? 'ring-primary ring-2' : ''}`}
                        >
                          <input
                            type='checkbox'
                            aria-label='Select attachment'
                            className='absolute top-2 left-2'
                            checked={selectedIds.has(a.id)}
                            onChange={(e) => {
                              const ns = new Set(selectedIds);
                              if (e.target.checked) ns.add(a.id);
                              else ns.delete(a.id);
                              setSelectedIds(ns);
                            }}
                          />
                          <div
                            className='truncate font-medium break-all'
                            title={a.original_name}
                          >
                            {a.original_name}
                          </div>
                          <div className='text-muted-foreground'>
                            {a.attachment_type}
                          </div>
                          {a.attachment_type === 'photo' && (
                            <img
                              onClick={() => {
                                setViewerIndex(idx);
                                setViewerOpen(true);
                              }}
                              src={attUrls[a.id] || a.storage_path}
                              alt={a.original_name}
                              className='h-32 w-full cursor-zoom-in rounded object-cover'
                            />
                          )}
                          {a.attachment_type === 'audio' && (
                            <audio
                              src={attUrls[a.id] || a.storage_path}
                              controls
                              className='w-full'
                            />
                          )}
                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                document
                                  .getElementById(`replace-${a.id}`)
                                  ?.click()
                              }
                            >
                              Replace
                            </Button>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={async () => {
                                await serviceTicketsApi.deleteTicketAttachment(
                                  a.id
                                );
                                const listed =
                                  await serviceTicketsApi.listTicketAttachments(
                                    ticketId
                                  );
                                if (listed.success && listed.data)
                                  setAttachments(listed.data);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                          <input
                            id={`replace-${a.id}`}
                            type='file'
                            className='hidden'
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              await serviceTicketsApi.uploadAttachments({
                                ticketId,
                                files: [f],
                                type: a.attachment_type
                              });
                              await serviceTicketsApi.deleteTicketAttachment(
                                a.id
                              );
                              const listed =
                                await serviceTicketsApi.listTicketAttachments(
                                  ticketId
                                );
                              if (listed.success && listed.data)
                                setAttachments(listed.data);
                            }}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <MediaViewerModal
              attachments={attachments.filter((a) =>
                attFilter === 'all'
                  ? true
                  : attFilter === 'photo'
                    ? a.attachment_type === 'photo'
                    : a.attachment_type === 'audio'
              )}
              index={viewerIndex}
              open={viewerOpen}
              onClose={() => setViewerOpen(false)}
            />
          </TabsContent>

          <TabsContent value='activity'>
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Activity Filters */}
                <div className='flex flex-wrap items-center gap-2 text-xs'>
                  <span className='text-muted-foreground mr-1'>Filter:</span>
                  {[
                    'all',
                    'created',
                    'triaged',
                    'status_changed',
                    'updated'
                  ].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActivityFilter(f as any)}
                      className={`rounded px-2 py-1 ${activityFilter === f ? 'bg-secondary' : 'hover:bg-muted'}`}
                    >
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                {historyLoading ? (
                  <div className='text-muted-foreground text-sm'>
                    Loading timeline...
                  </div>
                ) : history.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No activity yet.
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {history
                      .filter((h) =>
                        activityFilter === 'all'
                          ? true
                          : h.action === activityFilter
                      )
                      .map((h) => (
                        <div key={h.id} className='flex items-start gap-3'>
                          <div className='mt-1'>{actionIcon(h.action)}</div>
                          <div className='text-sm'>
                            <div className='flex items-center gap-2 font-medium'>
                              <span>
                                {new Date(h.changed_at).toLocaleString()}
                              </span>
                              <span className='text-muted-foreground'>•</span>
                              <span className='capitalize'>
                                {h.action.replace('_', ' ')}
                              </span>
                            </div>
                            {renderChangeSummary(h)}
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
        </Tabs>
      </div>
    </PageContainer>
  );
}

function StatusBadge({ status }: { status: ServiceTicket['status'] }) {
  const cls = statusClass(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function statusClass(status: ServiceTicket['status']) {
  switch (status) {
    case 'reported':
      return 'bg-slate-100 text-slate-700';
    case 'triaged':
      return 'bg-indigo-100 text-indigo-700';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800';
    case 'waiting_approval':
      return 'bg-violet-100 text-violet-700';
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'delivered':
      return 'bg-teal-100 text-teal-700';
    case 'on_hold':
      return 'bg-zinc-100 text-zinc-700';
    case 'cancelled':
    case 'closed':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-muted text-foreground';
  }
}

function StickyTicketHeader({
  ticket,
  canEdit,
  onStatusChange
}: {
  ticket: ServiceTicket & { customer?: Customer };
  canEdit: boolean;
  onStatusChange: (s: ServiceTicket['status']) => Promise<void>;
}) {
  const actions = getActionsForStatus(ticket.status);
  return (
    <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 backdrop-blur'>
      <div className='flex items-center justify-between px-2 py-3'>
        <div className='flex items-center gap-3'>
          <div className='font-semibold'>{ticket.ticket_number}</div>
          <StatusBadge status={ticket.status} />
          <div className='text-muted-foreground text-xs'>
            Updated {new Date(ticket.updated_at).toLocaleString()}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {actions.map((a) => (
            <Button
              key={a.label}
              size='sm'
              variant={a.variant}
              disabled={!canEdit}
              onClick={() => onStatusChange(a.to)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getActionsForStatus(
  status: ServiceTicket['status']
): {
  label: string;
  to: ServiceTicket['status'];
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}[] {
  switch (status) {
    case 'reported':
      return [
        { label: 'Start', to: 'in_progress', variant: 'default' },
        {
          label: 'Request Approval',
          to: 'waiting_approval',
          variant: 'outline'
        }
      ];
    case 'triaged':
      return [
        { label: 'Start', to: 'in_progress', variant: 'default' },
        { label: 'On Hold', to: 'on_hold', variant: 'outline' }
      ];
    case 'in_progress':
      return [
        { label: 'Complete', to: 'completed', variant: 'default' },
        { label: 'On Hold', to: 'on_hold', variant: 'outline' }
      ];
    case 'waiting_approval':
      return [
        { label: 'Start', to: 'in_progress', variant: 'default' },
        { label: 'On Hold', to: 'on_hold', variant: 'outline' }
      ];
    case 'completed':
      return [{ label: 'Deliver', to: 'delivered', variant: 'default' }];
    case 'on_hold':
      return [{ label: 'Start', to: 'in_progress', variant: 'default' }];
    default:
      return [];
  }
}

const actionColors: Record<string, string> = {
  created: 'text-slate-600',
  triaged: 'text-indigo-600',
  status_changed: 'text-amber-700',
  updated: 'text-zinc-700'
};
function actionIcon(action: string) {
  switch (action) {
    case 'created':
      return <span className={`${actionColors[action]} text-xl`}>•</span>;
    case 'triaged':
      return <span className={`${actionColors[action]} text-xl`}>⚑</span>;
    case 'status_changed':
      return <span className={`${actionColors[action]} text-xl`}>↔</span>;
    default:
      return <span className={`${actionColors['updated']} text-xl`}>●</span>;
  }
}
function renderChangeSummary(h: ServiceTicketHistory) {
  // Minimal diff summary
  if (!h.previous_values || !h.new_values) return null;
  try {
    const prev = h.previous_values as any;
    const next = h.new_values as any;
    const changes: string[] = [];
    if (prev.status !== next.status)
      changes.push(`status: ${prev.status} → ${next.status}`);
    if (prev.triaged_at !== next.triaged_at) changes.push(`triaged_at set`);
    if (changes.length === 0) return null;
    return (
      <div className='text-muted-foreground text-xs'>{changes.join(' · ')}</div>
    );
  } catch {
    return null;
  }
}

function TicketAttachmentCard({
  att,
  onDeleted,
  onReplaced
}: {
  att: TicketAttachment;
  onDeleted: () => Promise<void>;
  onReplaced: (file: File) => Promise<void>;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
