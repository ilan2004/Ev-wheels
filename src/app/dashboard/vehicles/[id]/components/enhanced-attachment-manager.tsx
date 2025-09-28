'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Upload,
  Image as ImageIcon,
  Mic,
  File,
  X,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Grid3x3,
  List,
  Filter,
  Search,
  MoreVertical,
  Share2,
  Edit,
  Copy
} from 'lucide-react';
import type { TicketAttachment } from '@/lib/types/service-tickets';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EnhancedAttachmentManagerProps {
  vehicleId: string;
  ticketId: string;
  attachments: TicketAttachment[];
  onAttachmentsChange: (attachments: TicketAttachment[]) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export function EnhancedAttachmentManager({
  vehicleId,
  ticketId,
  attachments,
  onAttachmentsChange
}: EnhancedAttachmentManagerProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<
    'all' | 'photo' | 'audio' | 'document'
  >('all');
  const [selectedAttachment, setSelectedAttachment] =
    useState<TicketAttachment | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filter attachments
  const filteredAttachments = attachments.filter(
    (att) => filterType === 'all' || att.attachment_type === filterType
  );

  // Upload handler
  const handleUpload = useCallback(
    async (files: File[]) => {
      const newUploadingFiles: UploadingFile[] = files.map((file) => ({
        file,
        progress: 0,
        status: 'uploading' as const
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadingFile = newUploadingFiles[i];

        try {
          // Determine file type
          let attachmentType: 'photo' | 'audio' | 'document' = 'document';
          if (file.type.startsWith('image/')) attachmentType = 'photo';
          else if (file.type.startsWith('audio/')) attachmentType = 'audio';

          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadingFiles((prev) =>
              prev.map((uf) =>
                uf.file === file && uf.progress < 90
                  ? { ...uf, progress: uf.progress + 10 }
                  : uf
              )
            );
          }, 200);

          // Upload via API
          const serviceTicketsApi = (await import('@/lib/api/service-tickets'))
            .serviceTicketsApi;
          const res = await serviceTicketsApi.uploadAttachments({
            ticketId,
            files: [file],
            type: attachmentType,
            caseType: 'vehicle',
            caseId: vehicleId
          });

          clearInterval(progressInterval);

          if (res.success && res.data) {
            setUploadingFiles((prev) =>
              prev.map((uf) =>
                uf.file === file
                  ? { ...uf, progress: 100, status: 'success' }
                  : uf
              )
            );

            // Refresh attachments
            const listRes = await serviceTicketsApi.listVehicleAttachments(
              ticketId,
              vehicleId
            );
            if (listRes.success && listRes.data) {
              onAttachmentsChange(listRes.data);
            }

            toast.success(`${file.name} has been uploaded`);
          } else {
            throw new Error(res.error || 'Upload failed');
          }
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file
                ? {
                    ...uf,
                    status: 'error',
                    error:
                      error instanceof Error ? error.message : 'Upload failed'
                  }
                : uf
            )
          );

          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Clean up completed uploads after 3 seconds
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((uf) => uf.status === 'uploading')
        );
      }, 3000);
    },
    [vehicleId, ticketId, onAttachmentsChange, toast]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Load preview URLs
  React.useEffect(() => {
    const loadPreviews = async () => {
      for (const att of attachments) {
        if (att.attachment_type === 'photo' && !previewUrls[att.id]) {
          const bucket = 'media-photos';
          const { data } = await supabase.storage
            .from(bucket)
            .createSignedUrl(att.storage_path, 3600);

          if (data?.signedUrl) {
            setPreviewUrls((prev) => ({ ...prev, [att.id]: data.signedUrl }));
          }
        }
      }
    };
    loadPreviews();
  }, [attachments, previewUrls]);

  // Delete handler
  const handleDelete = async (attachmentId: string) => {
    setIsDeleting(attachmentId);

    try {
      const serviceTicketsApi = (await import('@/lib/api/service-tickets'))
        .serviceTicketsApi;
      await serviceTicketsApi.deleteTicketAttachment(attachmentId);

      const listRes = await serviceTicketsApi.listVehicleAttachments(
        ticketId,
        vehicleId
      );
      if (listRes.success && listRes.data) {
        onAttachmentsChange(listRes.data);
      }

      toast.success('The attachment has been removed');
    } catch (error) {
      toast.error('Failed to delete the attachment');
    } finally {
      setIsDeleting(null);
    }
  };

  // Get attachment icon
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return ImageIcon;
      case 'audio':
        return Mic;
      default:
        return File;
    }
  };

  // Attachment card component
  const AttachmentCard = ({ attachment }: { attachment: TicketAttachment }) => {
    const Icon = getAttachmentIcon(attachment.attachment_type);
    const isImage = attachment.attachment_type === 'photo';
    const previewUrl = previewUrls[attachment.id];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          'group bg-card relative overflow-hidden rounded-lg border transition-all hover:shadow-md',
          viewMode === 'grid' ? 'aspect-square' : ''
        )}
      >
        {viewMode === 'grid' ? (
          // Grid view
          <div className='relative h-full'>
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={attachment.original_name}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='bg-muted flex h-full items-center justify-center'>
                <Icon className='text-muted-foreground h-12 w-12' />
              </div>
            )}

            {/* Overlay */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100'>
              <div className='absolute right-0 bottom-0 left-0 p-3'>
                <p className='truncate text-xs font-medium text-white'>
                  {attachment.original_name}
                </p>
                <p className='text-xs text-white/80'>
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className='absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='secondary'
                      className='h-8 w-8'
                      onClick={() => {
                        setSelectedAttachment(attachment);
                        setShowLightbox(true);
                      }}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='secondary'
                      className='h-8 w-8'
                      onClick={() => handleDelete(attachment.id)}
                      disabled={isDeleting === attachment.id}
                    >
                      {isDeleting === attachment.id ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Trash2 className='h-4 w-4' />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          // List view
          <div className='flex items-center gap-4 p-4'>
            <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-lg'>
              <Icon className='text-muted-foreground h-5 w-5' />
            </div>

            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>
                {attachment.original_name}
              </p>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <span>{formatFileSize(attachment.file_size)}</span>
                <span>•</span>
                <span>
                  {format(new Date(attachment.uploaded_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <div className='flex gap-1'>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={() => {
                  setSelectedAttachment(attachment);
                  setShowLightbox(true);
                }}
              >
                <Eye className='h-4 w-4' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='h-8 w-8'
                onClick={() => handleDelete(attachment.id)}
                disabled={isDeleting === attachment.id}
              >
                {isDeleting === attachment.id ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Manage photos, audio recordings, and documents
              </CardDescription>
            </div>

            {/* View mode toggle */}
            <div className='flex items-center gap-2'>
              <Button
                size='icon'
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className='h-8 w-8'
              >
                <Grid3x3 className='h-4 w-4' />
              </Button>
              <Button
                size='icon'
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className='h-8 w-8'
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Upload area */}
          <div
            {...getRootProps()}
            className={cn(
              'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps()} />

            <Upload className='text-muted-foreground mx-auto h-12 w-12' />
            <p className='mt-4 text-sm font-medium'>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>
              or click to browse • Max 10MB per file
            </p>

            <div className='mt-4 flex justify-center gap-4'>
              <Badge variant='secondary'>
                <ImageIcon className='mr-1 h-3 w-3' />
                Images
              </Badge>
              <Badge variant='secondary'>
                <Mic className='mr-1 h-3 w-3' />
                Audio
              </Badge>
              <Badge variant='secondary'>
                <File className='mr-1 h-3 w-3' />
                Documents
              </Badge>
            </div>
          </div>

          {/* Upload progress */}
          {uploadingFiles.length > 0 && (
            <div className='space-y-2'>
              {uploadingFiles.map((uf, index) => (
                <div key={index} className='bg-muted/50 rounded-lg border p-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <File className='text-muted-foreground h-4 w-4' />
                      <span className='max-w-[200px] truncate text-sm font-medium'>
                        {uf.file.name}
                      </span>
                    </div>
                    {uf.status === 'success' && (
                      <CheckCircle2 className='h-4 w-4 text-green-600' />
                    )}
                    {uf.status === 'error' && (
                      <AlertCircle className='text-destructive h-4 w-4' />
                    )}
                  </div>

                  {uf.status === 'uploading' && (
                    <Progress value={uf.progress} className='h-1' />
                  )}

                  {uf.error && (
                    <p className='text-destructive mt-1 text-xs'>{uf.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <Tabs
            value={filterType}
            onValueChange={(v) => setFilterType(v as any)}
          >
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='all'>All ({attachments.length})</TabsTrigger>
              <TabsTrigger value='photo'>
                Photos (
                {
                  attachments.filter((a) => a.attachment_type === 'photo')
                    .length
                }
                )
              </TabsTrigger>
              <TabsTrigger value='audio'>
                Audio (
                {
                  attachments.filter((a) => a.attachment_type === 'audio')
                    .length
                }
                )
              </TabsTrigger>
              <TabsTrigger value='document'>
                Docs (
                {
                  attachments.filter((a) => a.attachment_type === 'document')
                    .length
                }
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Attachments grid/list */}
          {filteredAttachments.length > 0 ? (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
                  : 'space-y-2'
              )}
            >
              <AnimatePresence>
                {filteredAttachments.map((attachment) => (
                  <AttachmentCard key={attachment.id} attachment={attachment} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className='rounded-lg border border-dashed p-8'>
              <p className='text-muted-foreground text-center text-sm'>
                No {filterType === 'all' ? '' : filterType} attachments yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox for viewing attachments */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.original_name}</DialogTitle>
            <DialogDescription>
              {selectedAttachment &&
                `${formatFileSize(selectedAttachment.file_size)} • Uploaded ${format(
                  new Date(selectedAttachment.uploaded_at),
                  "MMM dd, yyyy 'at' HH:mm"
                )}`}
            </DialogDescription>
          </DialogHeader>

          {selectedAttachment && (
            <div className='mt-4'>
              {selectedAttachment.attachment_type === 'photo' &&
                previewUrls[selectedAttachment.id] && (
                  <img
                    src={previewUrls[selectedAttachment.id]}
                    alt={selectedAttachment.original_name}
                    className='max-h-[60vh] w-full object-contain'
                  />
                )}

              {selectedAttachment.attachment_type === 'audio' && (
                <div className='bg-muted rounded-lg p-6'>
                  <audio
                    ref={audioRef}
                    src={previewUrls[selectedAttachment.id]}
                    controls
                    className='w-full'
                  />
                </div>
              )}

              {selectedAttachment.attachment_type === 'document' && (
                <div className='bg-muted flex flex-col items-center justify-center rounded-lg p-12'>
                  <File className='text-muted-foreground h-16 w-16' />
                  <p className='mt-4 text-sm font-medium'>
                    {selectedAttachment.original_name}
                  </p>
                  <Button className='mt-4' variant='outline'>
                    <Download className='mr-2 h-4 w-4' />
                    Download Document
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
