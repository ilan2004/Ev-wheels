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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Upload,
  Camera,
  Mic,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Info,
  FileImage,
  Battery,
  Car,
  Zap,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export interface MediaCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  acceptedTypes: string[];
  maxFiles: number;
}

export interface UploadingFile {
  file: File;
  category: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

export interface EnhancedMediaUploaderProps {
  categories?: MediaCategory[];
  onUpload: (files: File[], category: string) => Promise<void>;
  maxFileSize?: number; // in MB
  className?: string;
}

const DEFAULT_CATEGORIES: MediaCategory[] = [
  {
    id: 'vehicle-exterior',
    label: 'Vehicle Exterior',
    icon: <Car className='h-5 w-5' />,
    description: 'Photos of vehicle body, paint, and exterior condition',
    examples: [
      'Front view',
      'Rear view',
      'Both sides',
      'Damage areas',
      'Registration plate'
    ],
    acceptedTypes: ['image/*'],
    maxFiles: 8
  },
  {
    id: 'vehicle-interior',
    label: 'Vehicle Interior',
    icon: <FileImage className='h-5 w-5' />,
    description: 'Dashboard, seats, controls, and interior components',
    examples: [
      'Dashboard & meters',
      'Control panel',
      'Seats',
      'Interior damage'
    ],
    acceptedTypes: ['image/*'],
    maxFiles: 6
  },
  {
    id: 'battery',
    label: 'Battery Pack',
    icon: <Battery className='h-5 w-5' />,
    description: 'Battery pack condition, terminals, and connections',
    examples: [
      'Overall battery view',
      'Battery terminals',
      'Wiring & connections',
      'BMS unit',
      'Serial number/label'
    ],
    acceptedTypes: ['image/*'],
    maxFiles: 8
  },
  {
    id: 'electrical',
    label: 'Electrical System',
    icon: <Zap className='h-5 w-5' />,
    description: 'Wiring, connectors, motor, and electrical components',
    examples: [
      'Motor assembly',
      'Controller unit',
      'Wiring harness',
      'Charging port',
      'Fuse box'
    ],
    acceptedTypes: ['image/*'],
    maxFiles: 6
  },
  {
    id: 'voice-notes',
    label: 'Voice Notes',
    icon: <Mic className='h-5 w-5' />,
    description: 'Audio recordings of customer complaints or technician notes',
    examples: [
      'Customer complaint description',
      'Technician observations',
      'Test drive notes'
    ],
    acceptedTypes: ['audio/*'],
    maxFiles: 3
  }
];

export function EnhancedMediaUploader({
  categories = DEFAULT_CATEGORIES,
  onUpload,
  maxFileSize = 10,
  className
}: EnhancedMediaUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeTab = categories.find((c) => c.id === activeCategory);
  const isAudioCategory = activeTab?.acceptedTypes.includes('audio/*');

  // Generate preview for images
  const generatePreview = useCallback(
    (file: File): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          resolve(undefined);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      });
    },
    []
  );

  // Handle file upload
  const handleUpload = useCallback(
    async (files: File[], category: string) => {
      const newUploadingFiles: UploadingFile[] = [];

      for (const file of files) {
        const preview = await generatePreview(file);
        newUploadingFiles.push({
          file,
          category,
          progress: 0,
          status: 'uploading',
          preview
        });
      }

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((uf) => {
              if (files.includes(uf.file) && uf.progress < 90) {
                return { ...uf, progress: uf.progress + 10 };
              }
              return uf;
            })
          );
        }, 200);

        // Call the actual upload function
        await onUpload(files, category);

        clearInterval(progressInterval);

        // Mark as success
        setUploadingFiles((prev) =>
          prev.map((uf) => {
            if (files.includes(uf.file)) {
              return { ...uf, progress: 100, status: 'success' };
            }
            return uf;
          })
        );

        toast.success(
          `${files.length} ${files.length === 1 ? 'file' : 'files'} uploaded successfully`
        );

        // Clean up after 3 seconds
        setTimeout(() => {
          setUploadingFiles((prev) =>
            prev.filter((uf) => !files.includes(uf.file))
          );
        }, 3000);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((uf) => {
            if (files.includes(uf.file)) {
              return {
                ...uf,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed'
              };
            }
            return uf;
          })
        );

        toast.error('Failed to upload files');
      }
    },
    [onUpload, generatePreview]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (acceptedFiles) => handleUpload(acceptedFiles, activeCategory),
    accept: activeTab?.acceptedTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxSize: maxFileSize * 1024 * 1024,
    maxFiles: activeTab?.maxFiles || 1,
    noClick: true,
    noKeyboard: true
  });

  // Voice recording handlers
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `voice-note-${Date.now()}.wav`, {
          type: 'audio/wav',
          lastModified: Date.now()
        });

        await handleUpload([file], activeCategory);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      let seconds = 0;
      recordingTimerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);

      toast.info('Recording started');
    } catch (error) {
      toast.error('Microphone access denied or unavailable');
    }
  }, [activeCategory, handleUpload]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      toast.success('Recording saved');
    }
  }, [isRecording]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Upload className='h-5 w-5' />
          Upload Media Attachments
        </CardTitle>
        <CardDescription>
          Upload photos and voice notes to document the vehicle/battery
          condition
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className='grid h-auto w-full grid-cols-2 lg:grid-cols-5'>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2'
              >
                {category.icon}
                <span className='hidden sm:inline'>{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className='mt-6 space-y-4'
            >
              {/* Category Info */}
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-2'>
                    <p className='font-medium'>{category.description}</p>
                    <div className='flex flex-wrap gap-2'>
                      {category.examples.map((example, idx) => (
                        <Badge
                          key={idx}
                          variant='secondary'
                          className='text-xs'
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={cn(
                  'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all',
                  isDragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
                )}
              >
                <input {...getInputProps()} />

                <div className='flex flex-col items-center gap-4'>
                  {isAudioCategory ? (
                    <>
                      <div className='bg-primary/10 rounded-full p-4'>
                        <Mic className='text-primary h-8 w-8' />
                      </div>

                      {isRecording ? (
                        <div className='space-y-3'>
                          <div className='flex items-center gap-3'>
                            <div className='h-3 w-3 animate-pulse rounded-full bg-red-500' />
                            <p className='text-lg font-semibold'>
                              Recording... {formatTime(recordingTime)}
                            </p>
                          </div>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={stopRecording}
                          >
                            <X className='mr-2 h-4 w-4' />
                            Stop Recording
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className='space-y-2'>
                            <p className='text-lg font-medium'>
                              Record a voice note
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              Click the button below to start recording
                            </p>
                          </div>
                          <Button
                            type='button'
                            onClick={startRecording}
                            className='mt-2'
                          >
                            <Mic className='mr-2 h-4 w-4' />
                            Start Recording
                          </Button>
                        </>
                      )}

                      <div className='mt-4 w-full border-t pt-4'>
                        <p className='text-muted-foreground mb-3 text-sm'>
                          Or upload an audio file
                        </p>
                        <Button type='button' variant='outline' onClick={open}>
                          <Upload className='mr-2 h-4 w-4' />
                          Choose Audio File
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className='bg-primary/10 rounded-full p-4'>
                        <Camera className='text-primary h-8 w-8' />
                      </div>

                      <div className='space-y-2'>
                        <p className='text-lg font-medium'>
                          {isDragActive
                            ? 'Drop your photos here'
                            : 'Upload photos'}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          Drag & drop images here, or click to browse
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          Max {category.maxFiles} files • {maxFileSize}MB per
                          file
                        </p>
                      </div>

                      <Button type='button' onClick={open} className='mt-2'>
                        <Upload className='mr-2 h-4 w-4' />
                        Choose Files
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Uploading Files Progress */}
        {uploadingFiles.length > 0 && (
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-medium'>Uploading Files</h4>
              <Badge variant='secondary'>
                {uploadingFiles.filter((f) => f.status === 'uploading').length}{' '}
                in progress
              </Badge>
            </div>

            <div className='space-y-2'>
              <AnimatePresence>
                {uploadingFiles.map((uploadFile, index) => (
                  <motion.div
                    key={`${uploadFile.file.name}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className='bg-muted/50 rounded-lg border p-3'
                  >
                    <div className='flex items-start gap-3'>
                      {/* Preview/Icon */}
                      <div className='flex-shrink-0'>
                        {uploadFile.preview ? (
                          <img
                            src={uploadFile.preview}
                            alt={uploadFile.file.name}
                            className='h-12 w-12 rounded object-cover'
                          />
                        ) : (
                          <div className='bg-muted flex h-12 w-12 items-center justify-center rounded'>
                            {uploadFile.file.type.startsWith('audio/') ? (
                              <Mic className='text-muted-foreground h-6 w-6' />
                            ) : (
                              <ImageIcon className='text-muted-foreground h-6 w-6' />
                            )}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>
                              {uploadFile.file.name}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {formatFileSize(uploadFile.file.size)} •{' '}
                              {
                                categories.find(
                                  (c) => c.id === uploadFile.category
                                )?.label
                              }
                            </p>
                          </div>

                          {/* Status Icon */}
                          <div className='flex-shrink-0'>
                            {uploadFile.status === 'success' && (
                              <CheckCircle2 className='h-5 w-5 text-green-600' />
                            )}
                            {uploadFile.status === 'error' && (
                              <AlertCircle className='text-destructive h-5 w-5' />
                            )}
                            {uploadFile.status === 'uploading' && (
                              <Loader2 className='text-primary h-5 w-5 animate-spin' />
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {uploadFile.status === 'uploading' && (
                          <div className='mt-2'>
                            <Progress
                              value={uploadFile.progress}
                              className='h-1.5'
                            />
                          </div>
                        )}

                        {/* Error Message */}
                        {uploadFile.error && (
                          <p className='text-destructive mt-1 text-xs'>
                            {uploadFile.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Help Text */}
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription className='text-xs'>
            <strong>Tips:</strong> Take clear, well-lit photos from multiple
            angles. For batteries, capture the serial number clearly. For voice
            notes, describe the issue in detail.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export { DEFAULT_CATEGORIES };
