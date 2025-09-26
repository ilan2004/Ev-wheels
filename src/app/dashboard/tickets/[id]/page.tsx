'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { SectionHeader } from '@/components/layout/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { ServiceTicket, TicketAttachment } from '@/lib/types/service-tickets';
import type { Customer } from '@/types/bms';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormFileUpload, type FileUploadConfig } from '@/components/forms/form-file-upload';
import { toast } from 'sonner';
import type { ServiceTicketHistory } from '@/lib/types/service-tickets';
import PageContainer from '@/components/layout/page-container';

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params?.id as string;
  const [ticket, setTicket] = useState<(ServiceTicket & { customer?: Customer }) | null>(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ServiceTicketHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const photoConfig: FileUploadConfig = useMemo(() => ({
    acceptedTypes: ['image/*'],
    multiple: true,
    maxFiles: 8,
    onUpload: async (files) => {
      const res = await serviceTicketsApi.uploadAttachments({ ticketId, files, type: 'photo' });
      if (!res.success) throw new Error(res.error || 'Failed to upload photos');
      const listed = await serviceTicketsApi.listTicketAttachments(ticketId);
      if (listed.success && listed.data) setAttachments(listed.data);
    }
  }), [ticketId]);

  const audioConfig: FileUploadConfig = useMemo(() => ({
    acceptedTypes: ['audio/*'],
    multiple: true,
    maxFiles: 3,
    onUpload: async (files) => {
      const res = await serviceTicketsApi.uploadAttachments({ ticketId, files, type: 'audio' });
      if (!res.success) throw new Error(res.error || 'Failed to upload audio');
      const listed = await serviceTicketsApi.listTicketAttachments(ticketId);
      if (listed.success && listed.data) setAttachments(listed.data);
    }
  }), [ticketId]);

  const triageSchema = z.object({ routeTo: z.enum(['vehicle','battery','both']), note: z.string().optional() });
  const triageForm = useForm<{ routeTo: 'vehicle'|'battery'|'both'; note?: string }>({ resolver: zodResolver(triageSchema), defaultValues: { routeTo: 'vehicle', note: '' } });

  async function onTriageSubmit(values: { routeTo: 'vehicle'|'battery'|'both'; note?: string }) {
    const res = await serviceTicketsApi.triageTicket({ ticketId, routeTo: values.routeTo, note: values.note });
    if (!res.success) return toast.error(res.error || 'Failed to triage');
    toast.success('Ticket triaged');
    // Reload ticket
    const updated = await serviceTicketsApi.fetchTicketWithRelations(ticketId);
    if (updated.success && updated.data) setTicket(updated.data.ticket);
  }

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <SectionHeader title={`Ticket ${ticket.ticket_number}`} description={ticket.symptom} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><div className="text-muted-foreground">Customer</div><div>{ticket.customer?.name || '-'}</div></div>
              <div><div className="text-muted-foreground">Status</div><div><Badge variant="secondary">{ticket.status}</Badge></div></div>
              <div><div className="text-muted-foreground">Vehicle</div><div>{ticket.vehicle_make || '-'} {ticket.vehicle_model || ''} {ticket.vehicle_reg_no ? `(${ticket.vehicle_reg_no})` : ''}</div></div>
              <div className="md:col-span-3">
                <div className="text-muted-foreground">Description</div>
                <div>{ticket.description || '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {ticket.status === 'waiting_approval' ? (
                <>
                  <div>
                    <Badge variant="outline">Pending customer approval</Badge>
                  </div>
                  {ticket.triage_notes && (
                    <div>
                      <div className="text-muted-foreground">Last approval note</div>
                      <div className="whitespace-pre-wrap">{ticket.triage_notes}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">No pending approval for this ticket.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked Cases</CardTitle>
            </CardHeader>
            <CardContent>
              {(!ticket.battery_case_id && !ticket.vehicle_case_id) && (
                <div className="text-sm text-muted-foreground">No linked cases yet.</div>
              )}
              <div className="flex flex-wrap gap-3">
                {ticket.battery_case_id && (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/batteries/${ticket.battery_case_id}`}>Battery Case</Link>
                  </Button>
                )}
                {ticket.vehicle_case_id && (
                  <Button variant="outline">Vehicle Case</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Triage & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...triageForm}>
                <form onSubmit={triageForm.handleSubmit(onTriageSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField name="routeTo" control={triageForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route To</FormLabel>
                      <FormControl>
                        <select className="border rounded px-2 py-2" {...field}>
                          <option value="vehicle">Vehicle</option>
                          <option value="battery">Battery (Phase 3)</option>
                          <option value="both">Both</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="note" control={triageForm.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional triage note" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="md:col-span-3 flex justify-end gap-2">
                    <Button type="submit">Apply Triage</Button>
                  </div>
                </form>
              </Form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Textarea id="approval-note" placeholder="Approval note (optional)" className="w-full" />
                </div>
                <div className="flex items-start md:justify-end">
                  <Button
                    onClick={async () => {
                      const note = (document.getElementById('approval-note') as HTMLTextAreaElement)?.value || '';
                      const res = await serviceTicketsApi.updateTicketStatus(ticketId, 'waiting_approval', note);
                      if (!res.success) return toast.error(res.error || 'Failed');
                      toast.success('Approval requested');
                      // refresh history
                      const h = await serviceTicketsApi.listTicketHistory(ticketId);
                      if (h.success && h.data) setHistory(h.data);
                      // refresh ticket to reflect new status and note
                      const updated = await serviceTicketsApi.fetchTicketWithRelations(ticketId);
                      if (updated.success && updated.data) setTicket(updated.data.ticket);
                    }}
                    variant="outline"
                  >
                    Request Customer Approval
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormFileUpload control={{} as any} name={"photos" as any} label="Photos" config={photoConfig} />
              <FormFileUpload control={{} as any} name={"audio" as any} label="Voice Notes" config={audioConfig} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Existing</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attachments yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attachments.map((a) => (
                    <TicketAttachmentCard
                      key={a.id}
                      att={a}
                      onDeleted={async () => {
                        const api = serviceTicketsApi;
                        await api.deleteTicketAttachment(a.id);
                        const listed = await api.listTicketAttachments(ticketId);
                        if (listed.success && listed.data) setAttachments(listed.data);
                      }}
                      onReplaced={async (file) => {
                        const api = serviceTicketsApi;
                        await api.uploadAttachments({ ticketId, files: [file], type: a.attachment_type });
                        await api.deleteTicketAttachment(a.id);
                        const listed = await api.listTicketAttachments(ticketId);
                        if (listed.success && listed.data) setAttachments(listed.data);
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading timeline...</div>
              ) : history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No activity yet.</div>
              ) : (
                <div className="space-y-4">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(h.changed_at).toLocaleString()} • {h.action.replace('_',' ')}
                        </div>
                        {h.notes && (
                          <div className="text-muted-foreground">{h.notes}</div>
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

function TicketAttachmentCard({ att, onDeleted, onReplaced }: { att: TicketAttachment; onDeleted: () => Promise<void>; onReplaced: (file: File) => Promise<void> }) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadUrl = async () => {
      try {
        const bucket = att.attachment_type === 'audio' ? 'media-audio' : 'media-photos';
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(att.storage_path, 60 * 60);
        if (!error) setUrl(data?.signedUrl || null);
      } finally {
        setLoading(false);
      }
    };
    loadUrl();
  }, [att]);

  return (
    <div className="border rounded p-2 text-xs flex flex-col gap-2">
      <div className="font-medium break-all">{att.original_name}</div>
      <div className="text-muted-foreground">{att.attachment_type}</div>
      {!loading && url && att.attachment_type === 'photo' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={att.original_name} className="w-full h-32 object-cover rounded" />
      )}
      {!loading && url && att.attachment_type === 'audio' && (
        <>
          <audio src={url} controls className="w-full" />
          {typeof att.duration === 'number' && (
            <div className="text-muted-foreground">Duration: {att.duration}s</div>
          )}
        </>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Replace</Button>
        <Button variant="destructive" size="sm" onClick={onDeleted}>Delete</Button>
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onReplaced(f); }} />
    </div>
  );
}
