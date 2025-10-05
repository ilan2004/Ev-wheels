'use client';

import React, { useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export interface VehicleSide {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface MandatoryVehiclePhotosProps {
  onPhotosChange: (photos: Record<string, File>) => void;
  className?: string;
}

const VEHICLE_SIDES: VehicleSide[] = [
  {
    id: 'front',
    label: 'Front View',
    description: 'Clear view of the front including headlights and bumper',
    required: true
  },
  {
    id: 'rear',
    label: 'Rear View',
    description:
      'Clear view of the back including tail lights and number plate',
    required: true
  },
  {
    id: 'left',
    label: 'Left Side',
    description: 'Full left side profile view',
    required: true
  },
  {
    id: 'right',
    label: 'Right Side',
    description: 'Full right side profile view',
    required: true
  }
];

export function MandatoryVehiclePhotos({
  onPhotosChange,
  className
}: MandatoryVehiclePhotosProps) {
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  // Calculate completion
  const requiredSides = VEHICLE_SIDES.filter((s) => s.required);
  const completedCount = requiredSides.filter((s) => photos[s.id]).length;
  const isComplete = completedCount === requiredSides.length;
  const progress = (completedCount / requiredSides.length) * 100;

  // Generate preview for uploaded image
  const generatePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle file upload for a specific side
  const handleFileUpload = useCallback(
    async (sideId: string, files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];

      // Validate it's an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      try {
        const preview = await generatePreview(file);

        setPhotos((prev) => {
          const updated = { ...prev, [sideId]: file };
          onPhotosChange(updated);
          return updated;
        });

        setPreviews((prev) => ({ ...prev, [sideId]: preview }));

        toast.success(
          `${VEHICLE_SIDES.find((s) => s.id === sideId)?.label} uploaded`
        );
      } catch (error) {
        toast.error('Failed to process image');
      }
    },
    [generatePreview, onPhotosChange]
  );

  // Remove photo for a specific side
  const removePhoto = useCallback(
    (sideId: string) => {
      setPhotos((prev) => {
        const updated = { ...prev };
        delete updated[sideId];
        onPhotosChange(updated);
        return updated;
      });

      setPreviews((prev) => {
        const updated = { ...prev };
        // Revoke the preview URL to free memory
        if (updated[sideId]) {
          URL.revokeObjectURL(updated[sideId]);
        }
        delete updated[sideId];
        return updated;
      });

      toast.info(
        `${VEHICLE_SIDES.find((s) => s.id === sideId)?.label} removed`
      );
    },
    [onPhotosChange]
  );

  // Dropzone configurations for all sides
  const frontDropzone = useDropzone({
    onDrop: (acceptedFiles) => handleFileUpload('front', acceptedFiles),
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
    disabled: !!photos['front']
  });

  const backDropzone = useDropzone({
    onDrop: (acceptedFiles) => handleFileUpload('back', acceptedFiles),
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
    disabled: !!photos['back']
  });

  const leftDropzone = useDropzone({
    onDrop: (acceptedFiles) => handleFileUpload('left', acceptedFiles),
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
    disabled: !!photos['left']
  });

  const rightDropzone = useDropzone({
    onDrop: (acceptedFiles) => handleFileUpload('right', acceptedFiles),
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
    disabled: !!photos['right']
  });

  // Map side IDs to their dropzone
  const getDropzone = (sideId: string) => {
    switch (sideId) {
      case 'front':
        return frontDropzone;
      case 'back':
        return backDropzone;
      case 'left':
        return leftDropzone;
      case 'right':
        return rightDropzone;
      default:
        return frontDropzone;
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='flex items-center gap-2'>
              <Camera className='h-5 w-5' />
              Required Vehicle Photos
              <Badge
                variant={isComplete ? 'default' : 'secondary'}
                className={isComplete ? 'bg-green-600' : ''}
              >
                {completedCount} / {requiredSides.length}
              </Badge>
            </CardTitle>
            <CardDescription className='mt-1.5'>
              Capture all 4 sides of the vehicle before submitting
            </CardDescription>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mt-4'>
          <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
            <motion.div
              className={cn(
                'h-full',
                isComplete ? 'bg-green-600' : 'bg-primary'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Alert for incomplete */}
        {!isComplete && (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              <strong>Action Required:</strong> Please upload photos of all 4
              sides of the vehicle. This is mandatory to create a job card.
            </AlertDescription>
          </Alert>
        )}

        {/* Success alert */}
        {isComplete && (
          <Alert className='border-green-600 bg-green-50 text-green-900'>
            <CheckCircle2 className='h-4 w-4 text-green-600' />
            <AlertDescription>
              <strong>All photos captured!</strong> You can now proceed to
              submit the job card.
            </AlertDescription>
          </Alert>
        )}

        {/* Photo Grid */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {VEHICLE_SIDES.map((side) => {
            const hasPhoto = !!photos[side.id];
            const { getRootProps, getInputProps, isDragActive, open } =
              getDropzone(side.id);

            return (
              <motion.div
                key={side.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * VEHICLE_SIDES.indexOf(side) }}
              >
                <div
                  className={cn(
                    'relative overflow-hidden rounded-lg border-2 transition-all',
                    hasPhoto
                      ? 'border-green-500 bg-green-50'
                      : 'border-muted-foreground/25 border-dashed',
                    isDragActive && 'border-primary bg-primary/5 scale-[1.02]'
                  )}
                >
                  {/* Label */}
                  <div className='absolute top-0 right-0 left-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-3'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-white'>
                        {side.label}
                      </span>
                      {side.required && (
                        <Badge
                          variant='destructive'
                          className='h-5 px-1.5 text-xs'
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                    {hasPhoto && (
                      <CheckCircle2 className='h-5 w-5 text-green-400' />
                    )}
                  </div>

                  {hasPhoto ? (
                    /* Photo Preview */
                    <div className='group relative'>
                      <img
                        src={previews[side.id]}
                        alt={side.label}
                        className='aspect-video w-full object-cover'
                      />

                      {/* Overlay with actions */}
                      <div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={open}
                        >
                          <Upload className='mr-2 h-4 w-4' />
                          Replace
                        </Button>
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          onClick={() => removePhoto(side.id)}
                        >
                          <X className='mr-2 h-4 w-4' />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Area */
                    <div
                      {...getRootProps()}
                      className='hover:bg-muted/30 flex aspect-video cursor-pointer flex-col items-center justify-center p-6 text-center transition-colors'
                    >
                      <input {...getInputProps()} />

                      <div className='bg-muted mb-3 rounded-full p-3'>
                        <Camera className='text-muted-foreground h-6 w-6' />
                      </div>

                      <p className='mb-1 text-sm font-medium'>
                        {isDragActive ? 'Drop photo here' : 'Upload photo'}
                      </p>
                      <p className='text-muted-foreground mb-3 text-xs'>
                        {side.description}
                      </p>

                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          open();
                        }}
                      >
                        <Upload className='mr-2 h-3 w-3' />
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tips */}
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription className='text-xs'>
            <strong>Photography Tips:</strong> Take photos in good lighting.
            Show the full vehicle from each angle. Capture any visible damage or
            unique features. Max 10MB per photo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
