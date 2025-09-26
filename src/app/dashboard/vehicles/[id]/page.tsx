"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { vehiclesApi, type VehicleCase, type VehicleStatus } from "@/lib/api/vehicles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VehicleStatusHistory, TicketAttachment } from "@/lib/types/service-tickets";
import { FormFileUpload, type FileUploadConfig } from "@/components/forms/form-file-upload";
import { supabase } from "@/lib/supabase/client";

const STATUSES: VehicleStatus[] = [
  "received",
  "diagnosed",
  "in_progress",
  "completed",
  "delivered",
  "on_hold",
  "cancelled",
];

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicleId = params?.id as string;

  const [vehicle, setVehicle] = useState<VehicleCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<VehicleStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [photoProgresses, setPhotoProgresses] = useState<Record<string, number>>({});
  const [audioProgresses, setAudioProgresses] = useState<Record<string, number>>({});

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
      const res = await (await import('@/lib/api/service-tickets')).serviceTicketsApi.listVehicleAttachments(vehicle.service_ticket_id, vehicle.id);
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
    acceptedTypes: ["image/*"],
    multiple: true,
    maxFiles: 8,
    maxSize: 10 * 1024 * 1024,
    progresses: photoProgresses,
    onUpload: async (files) => {
      if (!vehicle) throw new Error('Vehicle not loaded');
      const res = await (await import('@/lib/api/service-tickets')).serviceTicketsApi.uploadAttachments({
        ticketId: vehicle.service_ticket_id,
        files,
        type: 'photo',
        caseType: 'vehicle',
        caseId: vehicle.id,
        onProgress: (file, progress) => setPhotoProgresses((p) => ({ ...p, [file.name]: progress }))
      });
      if (!res.success) throw new Error(res.error || 'Failed to upload photos');
      const listed = await (await import('@/lib/api/service-tickets')).serviceTicketsApi.listVehicleAttachments(vehicle.service_ticket_id, vehicle.id);
      if (listed.success && listed.data) setAttachments(listed.data);
    }
  };

  const audioUploadConfig: FileUploadConfig = {
    acceptedTypes: ["audio/*"],
    multiple: true,
    maxFiles: 3,
    maxSize: 15 * 1024 * 1024,
    progresses: audioProgresses,
    onUpload: async (files) => {
      if (!vehicle) throw new Error('Vehicle not loaded');
      const res = await (await import('@/lib/api/service-tickets')).serviceTicketsApi.uploadAttachments({
        ticketId: vehicle.service_ticket_id,
        files,
        type: 'audio',
        caseType: 'vehicle',
        caseId: vehicle.id,
        onProgress: (file, progress) => setAudioProgresses((p) => ({ ...p, [file.name]: progress }))
      });
      if (!res.success) throw new Error(res.error || 'Failed to upload audio');
      const listed = await (await import('@/lib/api/service-tickets')).serviceTicketsApi.listVehicleAttachments(vehicle.service_ticket_id, vehicle.id);
      if (listed.success && listed.data) setAttachments(listed.data);
    }
  };

  const onChangeStatus = async (newStatus: VehicleStatus) => {
    if (!vehicle) return;
    setIsUpdating(true);
    const res = await vehiclesApi.updateVehicleStatus(vehicle.id, newStatus, notes || undefined);
    if (res.success && res.data) {
      setVehicle(res.data);
      setNotes("");
    }
    setIsUpdating(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!vehicle) return <div>Vehicle case not found</div>;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Vehicle Case Details" description="Diagnosis and repair status" />

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/vehicles")}>Back</Button>
        <div className="text-sm text-muted-foreground">Linked Ticket: <Link className="underline" href={`/dashboard/tickets/${vehicle.service_ticket_id}`}>{vehicle.service_ticket_id}</Link></div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Reg No</div>
            <div className="font-medium">{vehicle.vehicle_reg_no || "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Make & Model</div>
            <div className="font-medium">{vehicle.vehicle_make} {vehicle.vehicle_model}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div><Badge variant="secondary">{vehicle.status}</Badge></div>
          </div>
          <div className="md:col-span-3">
            <div className="text-muted-foreground">Technician Notes</div>
            <div className="text-sm">{vehicle.technician_notes || "-"}</div>
          </div>
        </CardContent>
      </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button key={s} variant={vehicle.status === s ? "default" : "outline"} disabled={isUpdating} onClick={() => onChangeStatus(s)}>
                {s.replace("_"," ")}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Optional note for this change</div>
            <Textarea placeholder="Add a brief note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" disabled={isUpdating} onClick={async () => { if (!vehicle) return; const res = await vehiclesApi.updateVehicleNotes(vehicle.id, notes); if (res.success && res.data) { setVehicle(res.data); setNotes(""); } }}>
                Save Notes
              </Button>
            </div>
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : history.length === 0 ? (
                <div className="text-sm text-muted-foreground">No history yet.</div>
              ) : (
                <div className="space-y-4">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(h.changed_at).toLocaleString()} • {h.new_status.replace("_"," ")}
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

        <TabsContent value="attachments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormFileUpload control={{} as any} name={"photos" as any} label="Photos" config={photoUploadConfig} />
              <FormFileUpload control={{} as any} name={"audio" as any} label="Voice Notes" config={audioUploadConfig} />
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
                    <VehicleAttachmentCard key={a.id} att={a} onDeleted={async () => {
                      const api = (await import('@/lib/api/service-tickets')).serviceTicketsApi;
                      await api.deleteTicketAttachment(a.id);
                      const listed = await api.listVehicleAttachments(vehicle!.service_ticket_id, vehicle!.id);
                      if (listed.success && listed.data) setAttachments(listed.data);
                    }} onReplaced={async (file) => {
                      const api = (await import('@/lib/api/service-tickets')).serviceTicketsApi;
                      await api.uploadAttachments({ ticketId: vehicle!.service_ticket_id, files: [file], type: a.attachment_type, caseType: 'vehicle', caseId: vehicle!.id });
                      await api.deleteTicketAttachment(a.id);
                      const listed = await api.listVehicleAttachments(vehicle!.service_ticket_id, vehicle!.id);
                      if (listed.success && listed.data) setAttachments(listed.data);
                    }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VehicleAttachmentCard({ att, onDeleted, onReplaced }: { att: TicketAttachment; onDeleted: () => Promise<void>; onReplaced: (file: File) => Promise<void> }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (f) await onReplaced(f);
      }} />
    </div>
  );
}

