'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { SectionHeader } from '@/components/layout/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CaseManagement } from '@/components/tickets/CaseManagement';
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
import { EnhancedMediaUploader } from '@/components/job-cards/enhanced-media-uploader';
import { MediaViewerModal } from '@/components/media/media-viewer-modal';
import { toast } from 'sonner';
import { ToastManager } from '@/lib/toast-utils';
import type { ServiceTicketHistory } from '@/lib/types/service-tickets';
import PageContainer from '@/components/layout/page-container';
import { useRequireAuth } from '@/lib/auth/use-require-auth';
import { useAuth } from '@/hooks/use-auth';

export default function JobCardDetailPage() {
  // Require an authenticated session to view and upload attachments
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const ticketId = params?.id as string;
  const { isAdmin, isTechnician } = useAuth();
  const canEdit = isAdmin || isTechnician;
  const [ticket, setTicket] = useState<
    | (ServiceTicket & {
        customer?: Customer;
        creator?: { username: string; email: string };
      })
    | null
  >(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ServiceTicketHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Phase 2 state: attachments filter/sort/selection and viewer
  const [attFilter, setAttFilter] = useState<'all' | 'photo' | 'audio'>('all');
  const [attScopeFilter, setAttScopeFilter] = useState<
    'all' | 'vehicle' | 'battery'
  >('all');

  // Read scope from URL params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const scopeParam = urlParams.get('scope');
      if (scopeParam === 'vehicle' || scopeParam === 'battery') {
        setAttScopeFilter(scopeParam);
        // Also switch to attachments tab if scope is specified
        const tabParam = urlParams.get('tab');
        if (tabParam === 'attachments') {
          // Focus the attachments tab
          setTimeout(() => {
            const attachmentsTab = document.querySelector(
              '[value="attachments"]'
            ) as HTMLElement;
            attachmentsTab?.click();
          }, 100);
        }
      }
    }
  }, []);
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
  const [linkedCasesDetails, setLinkedCasesDetails] = useState<{
    vehicleCase?: {
      id: string;
      vehicle_reg_no: string;
      vehicle_make: string;
      vehicle_model: string;
      status: string;
    };
    batteryCase?: {
      id: string;
      serial_number: string;
      brand: string;
      status: string;
    };
  }>({});

  useEffect(() => {
    const load = async () => {
      const res = await serviceTicketsApi.fetchTicketWithRelations(ticketId);
      if (res.success && res.data) {
        setTicket(res.data.ticket);
        setAttachments(res.data.attachments);

        // Load linked cases details
        const casesDetails: any = {};

        if (res.data.ticket.vehicle_case_id) {
          try {
            const vehicleRes = await (
              await import('@/lib/api/vehicles')
            ).vehiclesApi.fetchVehicle(res.data.ticket.vehicle_case_id);

            if (vehicleRes.success && vehicleRes.data) {
              casesDetails.vehicleCase = {
                id: vehicleRes.data.id,
                vehicle_reg_no: vehicleRes.data.vehicle_reg_no,
                vehicle_make: vehicleRes.data.vehicle_make,
                vehicle_model: vehicleRes.data.vehicle_model,
                status: vehicleRes.data.status
              };
            }
          } catch (error) {
            console.error('Error loading vehicle case details:', error);
          }
        }

        if (res.data.ticket.battery_case_id) {
          try {
            const batteryRes = await (
              await import('@/lib/api/batteries')
            ).batteryApi.fetchBattery(res.data.ticket.battery_case_id);

            if (batteryRes.success && batteryRes.data) {
              casesDetails.batteryCase = {
                id: batteryRes.data.id,
                serial_number: batteryRes.data.serial_number,
                brand: batteryRes.data.brand,
                status: batteryRes.data.status
              };
            }
          } catch (error) {
            console.error('Error loading battery case details:', error);
          }
        }

        setLinkedCasesDetails(casesDetails);
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

  const handleMediaUpload = async (files: File[], category: string) => {
    const loadingToastId = ToastManager.file.uploading();
    
    try {
      // Determine attachment type based on category
      let attachmentType: 'photo' | 'audio' = 'photo';
      if (category === 'voice-notes') {
        attachmentType = 'audio';
      }

      const res = await serviceTicketsApi.uploadAttachments({
        ticketId,
        files,
        type: attachmentType
      });

      if (!res.success) {
        ToastManager.error(loadingToastId, res.error || 'Failed to upload files');
        return;
      }

      // Refresh attachments list
      const listed = await serviceTicketsApi.listTicketAttachments(ticketId);
      if (listed.success && listed.data) setAttachments(listed.data);
      
      ToastManager.file.uploaded(loadingToastId);
    } catch (error) {
      ToastManager.error(
        loadingToastId,
        error instanceof Error ? error.message : 'Failed to upload files'
      );
    }
  };

  if (loading)
    return (
      <PageContainer>
        <div className='flex flex-col gap-6'>
          <SectionHeader title='Job Card Details' />
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
  if (!ticket) return <div>Job card not found</div>;

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <StickyTicketHeader
          ticket={ticket}
          canEdit={canEdit}
          onStatusChange={async (s) => {
            const loadingToastId = ToastManager.ticket.updating();
            
            try {
              const res = await serviceTicketsApi.updateTicketStatus(ticketId, s);
              if (!res.success) {
                ToastManager.error(loadingToastId, res.error || 'Failed to update status');
                return;
              }
              
              const updated =
                await serviceTicketsApi.fetchTicketWithRelations(ticketId);
              if (updated.success && updated.data) setTicket(updated.data.ticket);
              const h = await serviceTicketsApi.listTicketHistory(ticketId);
              if (h.success && h.data) setHistory(h.data);
              
              ToastManager.ticket.updated(loadingToastId);
            } catch (error) {
              ToastManager.error(
                loadingToastId, 
                error instanceof Error ? error.message : 'Failed to update status'
              );
            }
          }}
        />
        <SectionHeader
          title={`Job Card ${ticket.ticket_number}`}
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
                <div>
                  <div className='text-muted-foreground'>Created By</div>
                  <div>
                    {ticket.creator?.username || ticket.creator?.email || '-'}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>Created At</div>
                  <div>{new Date(ticket.created_at).toLocaleString()}</div>
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
                    No pending approval for this job card.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intake Media</CardTitle>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    No media uploaded yet.
                  </div>
                ) : (
                  <div>
                    <div className='mb-3 flex items-center justify-between'>
                      <div className='text-sm'>
                        <span className='font-medium'>
                          {
                            attachments.filter(
                              (a) => a.attachment_type === 'photo'
                            ).length
                          }
                        </span>{' '}
                        photos,{' '}
                        <span className='font-medium'>
                          {
                            attachments.filter(
                              (a) => a.attachment_type === 'audio'
                            ).length
                          }
                        </span>{' '}
                        audio files
                        {(ticket.vehicle_case_id || ticket.battery_case_id) && (
                          <div className='text-muted-foreground mt-1 text-xs'>
                            {ticket.vehicle_case_id && (
                              <span>
                                Vehicle:{' '}
                                {
                                  attachments.filter(
                                    (a) => a.case_type === 'vehicle'
                                  ).length
                                }
                              </span>
                            )}
                            {ticket.vehicle_case_id &&
                              ticket.battery_case_id && (
                                <span className='mx-1'>•</span>
                              )}
                            {ticket.battery_case_id && (
                              <span>
                                Battery:{' '}
                                {
                                  attachments.filter(
                                    (a) => a.case_type === 'battery'
                                  ).length
                                }
                              </span>
                            )}
                            {attachments.filter(
                              (a) => !a.case_type || a.case_type === null
                            ).length > 0 && (
                              <span>
                                {ticket.vehicle_case_id ||
                                ticket.battery_case_id
                                  ? ' • '
                                  : ''}
                                General:{' '}
                                {
                                  attachments.filter(
                                    (a) => !a.case_type || a.case_type === null
                                  ).length
                                }
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant='link'
                        size='sm'
                        onClick={() => {
                          const tabsList =
                            document.querySelector('[role="tablist"]');
                          const attachmentsTab = tabsList?.querySelector(
                            '[value="attachments"]'
                          ) as HTMLElement;
                          attachmentsTab?.click();
                        }}
                      >
                        View All →
                      </Button>
                    </div>
                    <div className='grid grid-cols-4 gap-2 md:grid-cols-6'>
                      {attachments
                        .filter((a) => a.attachment_type === 'photo')
                        .slice(0, 6)
                        .map((a) => (
                          <div key={a.id} className='relative aspect-square'>
                            <img
                              src={attUrls[a.id] || a.storage_path}
                              alt={a.original_name}
                              className='h-full w-full rounded object-cover'
                            />
                          </div>
                        ))}
                    </div>
                    {attachments.filter((a) => a.attachment_type === 'photo')
                      .length > 6 && (
                      <div className='text-muted-foreground mt-2 text-xs'>
                        +
                        {attachments.filter(
                          (a) => a.attachment_type === 'photo'
                        ).length - 6}{' '}
                        more
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <CaseManagement
              ticket={ticket}
              linkedCasesDetails={linkedCasesDetails}
              ticketId={ticketId}
              onRefresh={async () => {
                // refresh ticket data
                const res =
                  await serviceTicketsApi.fetchTicketWithRelations(ticketId);
                if (res.success && res.data) {
                  setTicket(res.data.ticket);

                  // Load linked cases details
                  const casesDetails: any = {};

                  if (res.data.ticket.vehicle_case_id) {
                    try {
                      const vehicleRes = await (
                        await import('@/lib/api/vehicles')
                      ).vehiclesApi.fetchVehicle(
                        res.data.ticket.vehicle_case_id
                      );

                      if (vehicleRes.success && vehicleRes.data) {
                        casesDetails.vehicleCase = {
                          id: vehicleRes.data.id,
                          vehicle_reg_no: vehicleRes.data.vehicle_reg_no,
                          vehicle_make: vehicleRes.data.vehicle_make,
                          vehicle_model: vehicleRes.data.vehicle_model,
                          status: vehicleRes.data.status
                        };
                      }
                    } catch (error) {
                      console.error(
                        'Error loading vehicle case details:',
                        error
                      );
                    }
                  }

                  if (res.data.ticket.battery_case_id) {
                    try {
                      const batteryRes = await (
                        await import('@/lib/api/batteries')
                      ).batteryApi.fetchBattery(
                        res.data.ticket.battery_case_id
                      );

                      if (batteryRes.success && batteryRes.data) {
                        casesDetails.batteryCase = {
                          id: batteryRes.data.id,
                          serial_number: batteryRes.data.serial_number,
                          brand: batteryRes.data.brand,
                          status: batteryRes.data.status
                        };
                      }
                    } catch (error) {
                      console.error(
                        'Error loading battery case details:',
                        error
                      );
                    }
                  }

                  setLinkedCasesDetails(casesDetails);
                }

                // refresh history
                const historyRes =
                  await serviceTicketsApi.listTicketHistory(ticketId);
                if (historyRes.success && historyRes.data) {
                  setHistory(historyRes.data);
                }
              }}
            />

            {/* Assignment removed: technicians self-handle; no assignee */}
          </TabsContent>

          <TabsContent value='attachments' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Existing Attachments</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Toolbar */}
                <div className='flex flex-wrap items-center gap-4'>
                  <div className='flex items-center gap-1 text-sm'>
                    <span className='text-muted-foreground mr-1'>Type:</span>
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

                  {/* Case Type Scope Filter */}
                  {(ticket.vehicle_case_id || ticket.battery_case_id) && (
                    <div className='flex items-center gap-1 text-sm'>
                      <span className='text-muted-foreground mr-1'>Scope:</span>
                      <button
                        onClick={() => setAttScopeFilter('all')}
                        className={`rounded px-2 py-1 ${attScopeFilter === 'all' ? 'bg-secondary' : 'hover:bg-muted'}`}
                      >
                        All
                      </button>
                      {ticket.vehicle_case_id && (
                        <button
                          onClick={() => setAttScopeFilter('vehicle')}
                          className={`rounded px-2 py-1 ${attScopeFilter === 'vehicle' ? 'bg-secondary' : 'hover:bg-muted'}`}
                        >
                          Vehicle
                        </button>
                      )}
                      {ticket.battery_case_id && (
                        <button
                          onClick={() => setAttScopeFilter('battery')}
                          className={`rounded px-2 py-1 ${attScopeFilter === 'battery' ? 'bg-secondary' : 'hover:bg-muted'}`}
                        >
                          Battery
                        </button>
                      )}
                    </div>
                  )}
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
                        const loadingToastId = ToastManager.file.deleting();
                        
                        try {
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
                            
                          ToastManager.success(
                            loadingToastId,
                            `${selectedIds.size} file(s) deleted successfully`
                          );
                        } catch (error) {
                          ToastManager.error(
                            loadingToastId,
                            error instanceof Error ? error.message : 'Failed to delete files'
                          );
                        }
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
                      .filter((a) => {
                        if (attScopeFilter === 'all') return true;
                        if (attScopeFilter === 'vehicle')
                          return a.case_type === 'vehicle';
                        if (attScopeFilter === 'battery')
                          return a.case_type === 'battery';
                        return true;
                      })
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
                                const loadingToastId = ToastManager.file.deleting();
                                
                                try {
                                  await serviceTicketsApi.deleteTicketAttachment(
                                    a.id
                                  );
                                  const listed =
                                    await serviceTicketsApi.listTicketAttachments(
                                      ticketId
                                    );
                                  if (listed.success && listed.data)
                                    setAttachments(listed.data);
                                    
                                  ToastManager.file.deleted(loadingToastId);
                                } catch (error) {
                                  ToastManager.error(
                                    loadingToastId,
                                    error instanceof Error ? error.message : 'Failed to delete file'
                                  );
                                }
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
                              
                              const loadingToastId = ToastManager.loading('Replacing file...');
                              
                              try {
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
                                  
                                ToastManager.success(loadingToastId, 'File replaced successfully');
                              } catch (error) {
                                ToastManager.error(
                                  loadingToastId,
                                  error instanceof Error ? error.message : 'Failed to replace file'
                                );
                              }
                            }}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <EnhancedMediaUploader
              onUpload={handleMediaUpload}
              maxFileSize={10}
            />

            <MediaViewerModal
              attachments={attachments
                .filter((a) =>
                  attFilter === 'all'
                    ? true
                    : attFilter === 'photo'
                      ? a.attachment_type === 'photo'
                      : a.attachment_type === 'audio'
                )
                .filter((a) => {
                  if (attScopeFilter === 'all') return true;
                  if (attScopeFilter === 'vehicle')
                    return a.case_type === 'vehicle';
                  if (attScopeFilter === 'battery')
                    return a.case_type === 'battery';
                  return true;
                })}
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
  ticket: ServiceTicket & {
    customer?: Customer;
    creator?: { username: string; email: string };
  };
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

function getActionsForStatus(status: ServiceTicket['status']): {
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
