"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut, IconX, IconPlayerPlay, IconDownload } from "@tabler/icons-react";
import type { TicketAttachment } from "@/lib/types/service-tickets";
import { supabase } from "@/lib/supabase/client";

interface MediaViewerModalProps {
  attachments: TicketAttachment[];
  index: number;
  open: boolean;
  onClose: () => void;
}

export function MediaViewerModal({ attachments, index, open, onClose }: MediaViewerModalProps) {
  const [current, setCurrent] = React.useState(index);
  const [zoom, setZoom] = React.useState(1);

  React.useEffect(() => {
    if (open) {
      setCurrent(index);
      setZoom(1);
    }
  }, [open, index]);

  const att = attachments[current];
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
  if (!att) return null;

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const bucket = att.attachment_type === 'audio' ? 'media-audio' : 'media-photos';
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(att.storage_path, 3600);
        if (!cancelled) setSignedUrl(!error ? data?.signedUrl || null : null);
      } catch {
        if (!cancelled) setSignedUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [att]);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(attachments.length - 1, c + 1));
  const zoomIn = () => setZoom((z) => Math.min(4, z + 0.25));
  const zoomOut = () => setZoom((z) => Math.max(0.25, z - 0.25));

  const isImage = att.attachment_type === "photo" || att.mime_type.startsWith("image/");
  const isAudio = att.attachment_type === "audio" || att.mime_type.startsWith("audio/");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{current + 1} / {attachments.length}</span>
              <span className="font-normal text-sm break-all">{att.original_name}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={zoomOut} aria-label="Zoom out"><IconZoomOut className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={zoomIn} aria-label="Zoom in"><IconZoomIn className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => window.open(att.storage_path, '_blank')} aria-label="Open"><IconDownload className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={onClose} aria-label="Close"><IconX className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex items-center justify-center min-h-[420px] overflow-hidden bg-muted rounded">
          {isImage && (
            <img
              src={signedUrl || (att as any).preview_url || (att as any).signed_url || att.storage_path}
              alt={att.original_name}
              className="transition-transform select-none"
              style={{ transform: `scale(${zoom})`, maxHeight: 520 }}
            />
          )}
          {isAudio && (
            <div className="flex items-center justify-center p-6">
              <audio controls className="w-full">
                <source src={signedUrl || (att as any).preview_url || (att as any).signed_url || att.storage_path} />
              </audio>
            </div>
          )}

          <div className="absolute inset-y-0 left-2 flex items-center">
            <Button size="icon" variant="secondary" onClick={prev} disabled={current === 0} aria-label="Previous">
              <IconChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Button size="icon" variant="secondary" onClick={next} disabled={current === attachments.length - 1} aria-label="Next">
              <IconChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

