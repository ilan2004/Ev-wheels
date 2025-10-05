'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Info,
  Mic,
  Car,
  Battery,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export interface UnifiedMediaUploaderProps {
  intakeType: 'vehicle' | 'battery';
  onMandatoryPhotosChange?: (photos: Record<string, File>) => void;
  onOptionalFilesChange?: (files: Record<string, File[]>) => void;
  className?: string;
}

interface MandatorySlot {
  id: string;
  label: string;
  description: string;
}

const VEHICLE_MANDATORY_SLOTS: MandatorySlot[] = [
  { id: 'front', label: 'Front', description: 'Front view with headlights' },
  { id: 'rear', label: 'Rear', description: 'Rear with tail lights & plate' },
  { id: 'left', label: 'Left Side', description: 'Full left side profile' },
  { id: 'right', label: 'Right Side', description: 'Full right side profile' }
];

export function UnifiedMediaUploader({
  intakeType,
  onMandatoryPhotosChange,
  onOptionalFilesChange,
  className
}: UnifiedMediaUploaderProps) {
  const [mandatoryPhotos, setMandatoryPhotos] = useState<Record<string, File>>(
    {}
  );
  const [mandatoryPreviews, setMandatoryPreviews] = useState<
    Record<string, string>
  >({});
  const [optionalFiles, setOptionalFiles] = useState<Record<string, File[]>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<string>('required');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const isVehicle = intakeType === 'vehicle';
  const mandatoryCount = Object.keys(mandatoryPhotos).length;
  const mandatoryComplete = isVehicle ? mandatoryCount === 4 : true;
  const mandatoryProgress = isVehicle ? (mandatoryCount / 4) * 100 : 100;

  // Generate preview
  const generatePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle mandatory photo upload
  const handleMandatoryUpload = useCallback(
    async (slotId: string, files: File[]) => {
      if (files.length === 0) return;
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      try {
        const preview = await generatePreview(file);
        setMandatoryPhotos((prev) => {
          const updated = { ...prev, [slotId]: file };
          onMandatoryPhotosChange?.(updated);
          return updated;
        });
        setMandatoryPreviews((prev) => ({ ...prev, [slotId]: preview }));
        toast.success(
          `${VEHICLE_MANDATORY_SLOTS.find((s) => s.id === slotId)?.label} uploaded`
        );
      } catch (error) {
        toast.error('Failed to process image');
      }
    },
    [generatePreview, onMandatoryPhotosChange]
  );

  // Remove mandatory photo
  const removeMandatoryPhoto = useCallback(
    (slotId: string) => {
      setMandatoryPhotos((prev) => {
        const updated = { ...prev };
        delete updated[slotId];
        onMandatoryPhotosChange?.(updated);
        return updated;
      });
      setMandatoryPreviews((prev) => {
        const updated = { ...prev };
        delete updated[slotId];
        return updated;
      });
    },
    [onMandatoryPhotosChange]
  );

  // Handle optional file upload
  const handleOptionalUpload = useCallback(
    async (category: string, files: File[]) => {
      setOptionalFiles((prev) => {
        const updated = {
          ...prev,
          [category]: [...(prev[category] || []), ...files]
        };
        onOptionalFilesChange?.(updated);
        return updated;
      });
      toast.success(`${files.length} file(s) added`);
    },
    [onOptionalFilesChange]
  );

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `voice-note-${Date.now()}.wav`, {
          type: 'audio/wav'
        });
        await handleOptionalUpload('voice', [file]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      let seconds = 0;
      recordingTimerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  }, [handleOptionalUpload]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, [isRecording]);

  // Dropzone for mandatory - create all 4 dropzones upfront
  const mandatoryDropzones = {
    front: useDropzone({
      onDrop: (files) => handleMandatoryUpload('front', files),
      accept: { 'image/*': [] },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
      disabled: !!mandatoryPhotos['front']
    }),
    rear: useDropzone({
      onDrop: (files) => handleMandatoryUpload('rear', files),
      accept: { 'image/*': [] },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
      disabled: !!mandatoryPhotos['rear']
    }),
    left: useDropzone({
      onDrop: (files) => handleMandatoryUpload('left', files),
      accept: { 'image/*': [] },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
      disabled: !!mandatoryPhotos['left']
    }),
    right: useDropzone({
      onDrop: (files) => handleMandatoryUpload('right', files),
      accept: { 'image/*': [] },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
      disabled: !!mandatoryPhotos['right']
    })
  };

  // Dropzone for optional
  const optionalDropzone = useDropzone({
    onDrop: (files) => handleOptionalUpload('additional', files),
    accept: { 'image/*': [], 'audio/*': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: true
  });

  const totalOptionalFiles = Object.values(optionalFiles).flat().length;

  return (
    <Card className={cn('overflow-hidden border-2', className)}>
      <CardHeader className='border-b bg-gradient-to-r from-blue-50 to-indigo-50'>
        <CardTitle className='flex items-center gap-2'>
          <div className='rounded-lg bg-blue-600 p-2'>
            <Camera className='h-5 w-5 text-white' />
          </div>
          <span className='text-gray-900'>Media Upload</span>
          {isVehicle && (
            <Badge
              variant={mandatoryComplete ? 'default' : 'secondary'}
              className={cn(
                'font-semibold',
                mandatoryComplete
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border-amber-300 bg-amber-100 text-amber-800'
              )}
            >
              {mandatoryCount}/4 Required
            </Badge>
          )}
        </CardTitle>
        <CardDescription className='text-gray-600'>
          {isVehicle
            ? 'Upload 4 vehicle photos (required), then add optional media'
            : 'Upload photos and voice notes for this battery case'}
        </CardDescription>

        {isVehicle && (
          <div className='mt-3'>
            <div className='h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner'>
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  mandatoryComplete
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${mandatoryProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Alert */}
        {isVehicle && !mandatoryComplete && (
          <Alert className='border-l-4 border-amber-500 bg-amber-50'>
            <AlertCircle className='h-4 w-4 text-amber-600' />
            <AlertDescription className='text-amber-900'>
              <strong className='text-amber-800'>Required:</strong> Upload
              photos of all 4 vehicle sides to continue.
            </AlertDescription>
          </Alert>
        )}

        {isVehicle && mandatoryComplete && (
          <Alert className='border-l-4 border-green-500 bg-green-50'>
            <CheckCircle2 className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-900'>
              <strong className='text-green-800'>
                All required photos uploaded!
              </strong>{' '}
              You can now add optional media or submit.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2 bg-gray-100 p-1'>
            <TabsTrigger
              value='required'
              className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm'
            >
              📸 {isVehicle ? 'Required Photos' : 'Photos'}
            </TabsTrigger>
            <TabsTrigger
              value='optional'
              className='data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm'
            >
              ➕ Additional ({totalOptionalFiles})
            </TabsTrigger>
          </TabsList>

          {/* REQUIRED TAB */}
          <TabsContent value='required' className='mt-4 space-y-4'>
            {isVehicle ? (
              <>
                <div className='grid grid-cols-2 gap-3'>
                  {VEHICLE_MANDATORY_SLOTS.map((slot) => {
                    const hasPhoto = !!mandatoryPhotos[slot.id];
                    const dropzone =
                      mandatoryDropzones[
                        slot.id as keyof typeof mandatoryDropzones
                      ];
                    const { getRootProps, getInputProps, isDragActive, open } =
                      dropzone;

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          'relative overflow-hidden rounded-lg border-2 transition-all duration-200',
                          hasPhoto
                            ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                            : 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30',
                          isDragActive &&
                            'scale-[1.02] border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-2',
                            hasPhoto
                              ? 'bg-gradient-to-b from-green-600/90 to-green-600/0'
                              : 'bg-gradient-to-b from-gray-900/60 to-transparent'
                          )}
                        >
                          <span className='text-xs font-semibold text-white drop-shadow-lg'>
                            {slot.label}
                          </span>
                          {hasPhoto && (
                            <div className='rounded-full bg-green-500 p-0.5'>
                              <CheckCircle2 className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </div>

                        {hasPhoto ? (
                          <div className='group relative'>
                            <img
                              src={mandatoryPreviews[slot.id]}
                              alt={slot.label}
                              className='aspect-video w-full object-cover'
                            />
                            <div className='absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 transition-all duration-200 group-hover:opacity-100'>
                              <Button
                                type='button'
                                size='sm'
                                onClick={open}
                                className='bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                              >
                                <Upload className='mr-1 h-3 w-3' />
                                Replace
                              </Button>
                              <Button
                                type='button'
                                size='sm'
                                onClick={() => removeMandatoryPhoto(slot.id)}
                                className='bg-red-600 text-white shadow-lg hover:bg-red-700'
                              >
                                <X className='mr-1 h-3 w-3' />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            {...getRootProps()}
                            className='group flex aspect-video cursor-pointer flex-col items-center justify-center p-3 transition-colors hover:bg-blue-50'
                          >
                            <input {...getInputProps()} />
                            <div className='mb-2 rounded-full bg-gray-100 p-2 transition-colors group-hover:bg-blue-100'>
                              <Camera className='h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-600' />
                            </div>
                            <p className='text-xs font-semibold text-gray-700'>
                              {isDragActive ? 'Drop here' : 'Click or Drop'}
                            </p>
                            <p className='mt-1 text-center text-[10px] text-gray-500'>
                              {slot.description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Alert className='border-l-4 border-blue-400 bg-blue-50'>
                  <Info className='h-4 w-4 text-blue-600' />
                  <AlertDescription className='text-xs text-blue-900'>
                    <strong className='text-blue-800'>Tip:</strong> Take clear
                    photos in good lighting. Show full vehicle from each angle.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div
                {...optionalDropzone.getRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
                  optionalDropzone.isDragActive
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                )}
              >
                <input {...optionalDropzone.getInputProps()} />
                <div className='mb-3 inline-block rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 p-4'>
                  <Camera className='h-12 w-12 text-indigo-600' />
                </div>
                <p className='font-semibold text-gray-900'>
                  Upload Battery Photos
                </p>
                <p className='mt-1 text-sm text-gray-600'>
                  Drag & drop or click to browse
                </p>
              </div>
            )}
          </TabsContent>

          {/* OPTIONAL TAB */}
          <TabsContent value='optional' className='mt-4 space-y-4'>
            <div className='space-y-3'>
              {/* Photo Upload */}
              <div
                {...optionalDropzone.getRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
                  optionalDropzone.isDragActive
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                )}
              >
                <input {...optionalDropzone.getInputProps()} />
                <div className='flex flex-col items-center gap-2'>
                  <div className='rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 p-3'>
                    <Camera className='h-6 w-6 text-indigo-600' />
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>
                      Additional Photos
                    </p>
                    <p className='text-sm text-gray-600'>
                      Interior, damage, or detail shots
                    </p>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      optionalDropzone.open();
                    }}
                    className='mt-1 bg-indigo-600 text-white hover:bg-indigo-700'
                  >
                    <Upload className='mr-2 h-4 w-4' />
                    Choose Files
                  </Button>
                </div>
              </div>

              {/* Voice Recording */}
              <div className='rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='rounded-full bg-gradient-to-br from-purple-100 to-pink-100 p-3'>
                    <Mic className='h-6 w-6 text-purple-600' />
                  </div>
                  {isRecording ? (
                    <>
                      <div className='flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md'>
                        <div className='h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-lg shadow-red-300' />
                        <span className='font-semibold text-red-700'>
                          Recording... {Math.floor(recordingTime / 60)}:
                          {(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <Button
                        type='button'
                        size='sm'
                        onClick={stopRecording}
                        className='mt-2 bg-red-600 text-white hover:bg-red-700'
                      >
                        <X className='mr-2 h-4 w-4' />
                        Stop Recording
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className='font-semibold text-gray-900'>
                          Voice Note
                        </p>
                        <p className='text-sm text-gray-600'>
                          Record customer complaint or notes
                        </p>
                      </div>
                      <Button
                        type='button'
                        size='sm'
                        onClick={startRecording}
                        className='mt-1 bg-purple-600 text-white hover:bg-purple-700'
                      >
                        <Mic className='mr-2 h-4 w-4' />
                        Start Recording
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {totalOptionalFiles > 0 && (
              <Alert className='border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50'>
                <Info className='h-4 w-4 text-indigo-600' />
                <AlertDescription className='text-indigo-900'>
                  <strong className='text-indigo-800'>
                    {totalOptionalFiles}
                  </strong>{' '}
                  additional file{totalOptionalFiles !== 1 ? 's' : ''} ready to
                  upload
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
