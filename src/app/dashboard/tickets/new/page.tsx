'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { SectionHeader } from '@/components/layout/section-header';
import { serviceTicketsApi } from '@/lib/api/service-tickets';
import { UnifiedMediaUploader } from '@/components/job-cards/unified-media-uploader';
import { CustomerPicker } from '@/components/customers/customer-picker';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { useRequireAuth } from '@/lib/auth/use-require-auth';

const schema = z.object({
  intake_type: z.enum(['vehicle', 'battery']).default('vehicle'),
  customer_id: z.string().min(1, 'Please select a customer'),
  symptom: z.string().min(1, 'Symptom is required'),
  description: z.string().optional(),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_reg_no: z.string().optional(),
  vehicle_year: z
    .string()
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val.trim() === '' ||
        (Number.isFinite(Number(val)) &&
          Number(val) > 1900 &&
          Number(val) < 2100),
      {
        message: 'Enter a valid year'
      }
    ),
  // For upload widgets (not validated here)
  photos: z.any().optional(),
  audio: z.any().optional()
});

type FormValues = z.input<typeof schema>;

export default function NewServiceTicketPage() {
  // Require an authenticated session to create tickets
  // Redirects to /login if not signed in
  useRequireAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mandatoryPhotos, setMandatoryPhotos] = useState<Record<string, File>>(
    {}
  );
  const [optionalFiles, setOptionalFiles] = useState<Record<string, File[]>>(
    {}
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      intake_type: 'vehicle',
      customer_id: '',
      symptom: '',
      description: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_reg_no: '',
      vehicle_year: undefined,
      photos: [],
      audio: []
    }
  });

  const createdTicketId = React.useRef<string | null>(null);

  // Track intake type and completion
  const intakeType = form.watch('intake_type');
  const isVehicleIntake = intakeType === 'vehicle';
  const mandatoryPhotosCount = Object.keys(mandatoryPhotos).length;
  const mandatoryPhotosComplete = isVehicleIntake
    ? mandatoryPhotosCount === 4
    : true;
  const totalOptionalFiles = Object.values(optionalFiles).flat().length;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const res = await serviceTicketsApi.createServiceTicket({
        customer_id: values.customer_id,
        symptom: values.symptom,
        description: values.description || null,
        vehicle_make: values.vehicle_make || null,
        vehicle_model: values.vehicle_model || null,
        vehicle_reg_no: values.vehicle_reg_no || null,
        vehicle_year: values.vehicle_year ? Number(values.vehicle_year) : null
      });
      if (!res.success || !res.data)
        throw new Error(res.error || 'Failed to create job card');
      const newTicketId = res.data.id;
      createdTicketId.current = newTicketId;
      toast.success(`Job card ${res.data.ticket_number || ''} created`);

      // Collect all files for upload
      const mandatoryPhotoFiles = Object.values(mandatoryPhotos);
      const optionalPhotoFiles = optionalFiles['additional'] || [];
      const voiceFiles = optionalFiles['voice'] || [];

      // Combine all photos
      const allPhotos = [...mandatoryPhotoFiles, ...optionalPhotoFiles];
      const allAudio = voiceFiles;

      if (allPhotos.length > 0) {
        toast.info('Uploading photos...');
        const up = await serviceTicketsApi.uploadAttachments({
          ticketId: newTicketId,
          files: allPhotos,
          type: 'photo'
        });
        if (!up.success) throw new Error(up.error || 'Failed to upload photos');
      }

      if (allAudio.length > 0) {
        toast.info('Uploading audio...');
        const upa = await serviceTicketsApi.uploadAttachments({
          ticketId: newTicketId,
          files: allAudio,
          type: 'audio'
        });
        if (!upa.success)
          throw new Error(upa.error || 'Failed to upload audio');
      }

      // Navigate to detail page after uploads
      router.push(`/dashboard/job-cards/${newTicketId}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to create job card');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <SectionHeader
          title='Create Job Card'
          description='Log a customer issue and attach intake media.'
        />

        <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
          <div className='order-2 xl:order-1 xl:col-span-2'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Customer & Symptom</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='customer_id'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer *</FormLabel>
                            <FormControl>
                              <CustomerPicker
                                value={field.value || null}
                                onChange={(id) => field.onChange(id || '')}
                                allowQuickAdd
                                placeholder='Search or add customer'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='symptom'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symptom *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Describe the issue reported by customer'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <FormField
                        control={form.control}
                        name='vehicle_make'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Make</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='e.g., TVS, Bajaj'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='vehicle_model'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Model</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Model (optional)'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='vehicle_reg_no'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reg No</FormLabel>
                            <FormControl>
                              <Input placeholder='KL-xx-xxxx' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Unified Media Upload */}
                <UnifiedMediaUploader
                  intakeType={intakeType as 'vehicle' | 'battery'}
                  onMandatoryPhotosChange={setMandatoryPhotos}
                  onOptionalFilesChange={setOptionalFiles}
                />

                <div className='flex items-center justify-end gap-3'>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => router.push('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={
                      isSubmitting ||
                      (isVehicleIntake && !mandatoryPhotosComplete)
                    }
                  >
                    {isSubmitting ? 'Saving...' : 'Save Ticket'}
                    {mandatoryPhotosCount + totalOptionalFiles > 0 && (
                      <span className='ml-1 text-xs opacity-75'>
                        ({mandatoryPhotosCount + totalOptionalFiles} file
                        {mandatoryPhotosCount + totalOptionalFiles !== 1
                          ? 's'
                          : ''}
                        )
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          <div className='order-1 xl:order-2'>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className='text-muted-foreground space-y-3 text-sm'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
                  <p className='mb-2 text-sm font-semibold text-blue-900'>
                    📸 Media Upload
                  </p>
                  <div className='space-y-1.5 text-xs text-blue-800'>
                    {isVehicleIntake ? (
                      <>
                        <p>
                          • <strong>Required:</strong> 4 vehicle photos (Front,
                          Rear, Left, Right)
                        </p>
                        <p>
                          • <strong>Optional:</strong> Additional photos & voice
                          notes
                        </p>
                        <div className='mt-2 border-t border-blue-200 pt-2'>
                          <div className='flex items-center justify-between'>
                            <span>Required Photos:</span>
                            <span className='font-bold'>
                              {mandatoryPhotosCount} / 4{' '}
                              {mandatoryPhotosComplete && '✓'}
                            </span>
                          </div>
                          {totalOptionalFiles > 0 && (
                            <div className='mt-1 flex items-center justify-between'>
                              <span>Optional Files:</span>
                              <span className='font-bold'>
                                {totalOptionalFiles}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <p>• Upload battery photos and voice notes</p>
                        <p>• All media is optional for battery cases</p>
                        {totalOptionalFiles > 0 && (
                          <div className='mt-2 border-t border-blue-200 pt-2'>
                            <div className='flex items-center justify-between'>
                              <span>Files Ready:</span>
                              <span className='font-bold'>
                                {totalOptionalFiles}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <p className='text-xs'>
                  <strong>💡 Quick Start:</strong> Use the tabs in the media
                  upload section to add required photos first, then optional
                  media.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
